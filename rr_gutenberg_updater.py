# FILE: rr_gutenberg_updater.py — Updated for rr_ schema
import re
import time
import requests
from xml.etree import ElementTree as ET
from rr_config import supabase, log_step, logger

def normalize_author(author_str: str) -> str:
    if not author_str or author_str.strip() in ["", "Unknown"]:
        return "Unknown"
    author_str = re.sub(r'\s*\(\d{4}-\d{4}\)', '', author_str).strip()
    if ',' in author_str:
        parts = author_str.split(',', 1)
        return f"{parts[0].strip()}, {parts[1].strip() if len(parts) > 1 else ''}".strip()
    return author_str

def parse_gutindex(url: str) -> dict:
    books = {}
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        lines = r.text.splitlines()
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            match = re.search(r'(\d+)$', line)
            if match:
                book_id = int(match.group(1))
                title_author = line[:match.start()].strip()
                if " by " in title_author.lower():
                    title, author = title_author.rsplit(" by ", 1)
                else:
                    title, author = title_author, "Unknown"
                books[book_id] = {
                    "title": title.strip(),
                    "author": normalize_author(author.strip()),
                    "language": "en"
                }
            i += 1
    except Exception as e:
        logger.error(f"Error parsing {url}: {e}")
    return books

def parse_rss() -> dict:
    books = {}
    try:
        r = requests.get("https://www.gutenberg.org/cache/epub/feeds/today.rss", timeout=30)
        root = ET.fromstring(r.content)
        for item in root.findall(".//item"):
            title_elem = item.find("title")
            link_elem = item.find("link")
            if title_elem is None or link_elem is None: continue
            full_title = title_elem.text or ""
            link = link_elem.text or ""
            book_id_match = re.search(r'/ebooks/(\d+)', link)
            if not book_id_match: continue
            book_id = int(book_id_match.group(1))
            if " by " in full_title:
                title, author = full_title.rsplit(" by ", 1)
            else:
                title, author = full_title, "Unknown"
            books[book_id] = {
                "title": title.strip(),
                "author": normalize_author(author.strip()),
                "language": "en"
            }
    except Exception as e:
        logger.error(f"RSS parse error: {e}")
    return books

def update_gutenberg():
    log_step("GUTENBERG DAILY UPDATE STARTED (rr_ schema)")
    
    # Get existing books in new schema
    existing = supabase.table("rr_book") \
        .select("source_id") \
        .eq("source", "gutenberg") \
        .execute().data
    existing_ids = {int(row["source_id"]) for row in existing}
    
    logger.info(f"📊 rr_book already has {len(existing_ids):,} books")

    new_books = {}
    logger.info("📥 Fetching GUTINDEX...")
    new_books.update(parse_gutindex("https://www.gutenberg.org/dirs/GUTINDEX.2025"))
    new_books.update(parse_gutindex("https://www.gutenberg.org/dirs/GUTINDEX.2026"))
    logger.info("📥 Fetching daily RSS...")
    new_books.update(parse_rss())

    missing = {bid: data for bid, data in new_books.items() if bid not in existing_ids}
    logger.info(f"🎯 Found {len(missing):,} new books to add")

    for book_id, meta in missing.items():
        try:
            supabase.table("rr_book").insert({
                "source": "gutenberg",
                "source_id": str(book_id),
                "title": meta["title"],
                "author": meta["author"],
                "language": meta["language"]
            }).execute()
            
            supabase.table("rr_processing_queue").insert({
                "book_id": book_id,
                "status": "pending"
            }).execute()
            
            logger.info(f"✅ Added Book #{book_id} — {meta['title'][:60]}...")
        except Exception as e:
            logger.warning(f"⚠️ Failed to add Book #{book_id}: {e}")

    log_step("GUTENBERG UPDATE COMPLETE")
    return True

if __name__ == "__main__":
    update_gutenberg()
