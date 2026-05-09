# FILE: rr_gutenberg_updater.py — Self-contained & ULTRA-ROBUST + Discord Notification
import os
import re
import time
import requests
import logging
from xml.etree import ElementTree as ET
from supabase import create_client, Client

# ====================== DIRECT CONFIG ======================
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("RocketReaders")

def log_step(msg):
    logger.info(f"🚀 {msg}")
# ============================================================

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

def get_internal_book_id(gutenberg_id: int) -> int:
    for attempt in range(10):
        try:
            res = supabase.table("rr_book") \
                .select("id") \
                .eq("source", "gutenberg") \
                .eq("source_id", str(gutenberg_id)) \
                .single().execute()
            if res.data and res.data.get("id"):
                return res.data["id"]
        except Exception:
            pass
        time.sleep(0.5 + attempt * 0.2)
    raise Exception(f"Could not find internal id for Book #{gutenberg_id} after 10 attempts")

def send_discord_notification(added_books: list):
    if not DISCORD_WEBHOOK_URL or not added_books:
        return
    count = len(added_books)
    lines = [f"**🚀 Rocket Readers Updater** — {count} new book{'s' if count != 1 else ''} added today!\n"]
    for g_id, title, author in added_books:
        lines.append(f"• **#{g_id}** — {title} by {author}")
    message = "\n".join(lines)

    payload = {"content": message}
    try:
        requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10)
        logger.info(f"📧 Discord notification sent ({count} books)")
    except Exception as e:
        logger.warning(f"Failed to send Discord notification: {e}")

def update_gutenberg():
    log_step("GUTENBERG DAILY UPDATE STARTED (rr_ schema)")

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

    added_books = []  # for notification

    for gutenberg_id, meta in missing.items():
        try:
            book_payload = {
                "source": "gutenberg",
                "source_id": str(gutenberg_id),
                "title": meta["title"],
                "author": meta["author"],
                "language": meta["language"]
            }
            supabase.table("rr_book").upsert(book_payload).execute()
            time.sleep(0.8)

            internal_id = get_internal_book_id(gutenberg_id)

            supabase.table("rr_processing_queue").upsert({
                "book_id": internal_id,
                "status": "pending"
            }).execute()

            added_books.append((gutenberg_id, meta["title"], meta["author"]))
            logger.info(f"✅ Added Book #{gutenberg_id} (internal #{internal_id}) — {meta['title'][:60]}...")
        except Exception as e:
            logger.warning(f"⚠️ Failed to add Book #{gutenberg_id}: {e}")

    # ==========================================
    # DISCORD NOTIFICATION ENGINE
    # ==========================================
    if DISCORD_WEBHOOK_URL:
        logger.info("Sending notification to Discord...")
        
        if added_books:
            # Build a summary of the added books
            msg = f"🚀 **Rocket Readers Update**: Added **{len(added_books)}** new books to the queue!\n"
            
            # List up to 10 books so we don't break Discord's character limit
            for b in added_books[:10]:
                title = b[1][:40] + "..." if len(b[1]) > 40 else b[1]
                msg += f"- *{title}* by {b[2]}\n"
                
            if len(added_books) > 10:
                msg += f"...and {len(added_books) - 10} more."
        else:
            msg = "✅ **Rocket Readers Update**: Routine check complete. No new books found on Gutenberg today."

        # Fire the webhook
        try:
            response = requests.post(DISCORD_WEBHOOK_URL, json={"content": msg})
            response.raise_for_status()
            logger.info("Discord notification sent successfully!")
        except Exception as e:
            logger.error(f"Failed to send Discord message: {e}")
            
    else:
        logger.warning("DISCORD_WEBHOOK_URL not found in environment. Skipping notification.")

    log_step("GUTENBERG UPDATE COMPLETE")
    return True

if __name__ == "__main__":
    update_gutenberg()
