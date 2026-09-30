# FILE: rr_gutenberg_updater.py — Daily Gutenberg catalog + queue (GitHub Action)
# Runs in rocket-readers/.github/workflows/update_gutenberg.yml
#
# v3.0 (2026-07):
#   - Paginate existing source_id fetch (PostgREST default limit is 1000 — was broken)
#   - Queue uses INTERNAL rr_book.id (FK), not Gutenberg number
#   - English filter for RSS (do not force language="en" on non-English titles)
#   - Prefer RSS + recent GUTINDEX years; Discord always notifies
#   - Optional category assign hook note (subjects/bookshelves need full catalog)
# =================================================================================

from __future__ import annotations

import os
import re
import time
import logging
import requests
from datetime import datetime, timezone
from xml.etree import ElementTree as ET
from supabase import create_client, Client

# ====================== CONFIG ======================
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not url or not key:
    raise SystemExit("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger("RocketReaders")

PAGE_SIZE = 1000
ENGLISH_CODES = frozenset({"en", "english"})


def log_step(msg: str) -> None:
    logger.info(f"🚀 {msg}")


def normalize_author(author_str: str) -> str:
    if not author_str or author_str.strip() in ["", "Unknown"]:
        return "Unknown"
    author_str = re.sub(r"\s*\(\d{4}-\d{4}\)", "", author_str).strip()
    if "," in author_str:
        parts = author_str.split(",", 1)
        return f"{parts[0].strip()}, {parts[1].strip() if len(parts) > 1 else ''}".strip()
    return author_str


def is_english_lang(language_field: str | None) -> bool:
    if not language_field:
        return True  # RSS often omits language; treat as candidate
    parts = re.split(r"[;,]", language_field.lower())
    return any(p.strip() in ENGLISH_CODES for p in parts)


def fetch_all_existing_source_ids() -> set[int]:
    """
    Page through ALL gutenberg source_ids.
    Critical: bare .execute() only returns the first 1000 rows.
    """
    existing: set[int] = set()
    start = 0
    while True:
        end = start + PAGE_SIZE - 1
        res = (
            supabase.table("rr_book")
            .select("source_id")
            .eq("source", "gutenberg")
            .order("id")
            .range(start, end)
            .execute()
        )
        batch = res.data or []
        if not batch:
            break
        for row in batch:
            sid = row.get("source_id")
            if sid is None:
                continue
            try:
                existing.add(int(sid))
            except (TypeError, ValueError):
                continue
        if len(batch) < PAGE_SIZE:
            break
        start += PAGE_SIZE
        # safety against infinite loop
        if start > 500_000:
            logger.warning("Pagination safety stop at 500k")
            break
    return existing


def parse_gutindex(url: str) -> dict[int, dict]:
    books: dict[int, dict] = {}
    try:
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        for line in r.text.splitlines():
            line = line.strip()
            match = re.search(r"(\d+)$", line)
            if not match:
                continue
            book_id = int(match.group(1))
            title_author = line[: match.start()].strip()
            if " by " in title_author.lower():
                title, author = title_author.rsplit(" by ", 1)
            else:
                title, author = title_author, "Unknown"
            books[book_id] = {
                "title": title.strip(),
                "author": normalize_author(author.strip()),
                "language": "en",  # GUTINDEX lines used here are English-oriented feeds
            }
        logger.info(f"   GUTINDEX {url.split('/')[-1]}: {len(books):,} entries")
    except Exception as e:
        logger.error(f"Error parsing {url}: {e}")
    return books


def parse_rss() -> dict[int, dict]:
    books: dict[int, dict] = {}
    try:
        r = requests.get(
            "https://www.gutenberg.org/cache/epub/feeds/today.rss", timeout=30
        )
        r.raise_for_status()
        root = ET.fromstring(r.content)
        for item in root.findall(".//item"):
            title_elem = item.find("title")
            link_elem = item.find("link")
            if title_elem is None or link_elem is None:
                continue
            full_title = title_elem.text or ""
            link = link_elem.text or ""
            book_id_match = re.search(r"/ebooks/(\d+)", link)
            if not book_id_match:
                continue
            book_id = int(book_id_match.group(1))

            # Optional language from description / dc if present
            lang = "en"
            # Some feeds embed language in categories
            for cat in item.findall("category"):
                c = (cat.text or "").strip().lower()
                if c in ENGLISH_CODES or c.startswith("en"):
                    lang = "en"
                elif len(c) == 2 and c.isalpha():
                    lang = c

            if " by " in full_title:
                title, author = full_title.rsplit(" by ", 1)
            else:
                title, author = full_title, "Unknown"

            books[book_id] = {
                "title": title.strip(),
                "author": normalize_author(author.strip()),
                "language": lang,
            }
        logger.info(f"   RSS today: {len(books):,} items")
    except Exception as e:
        logger.error(f"RSS parse error: {e}")
    return books


def get_internal_book_id(gutenberg_id: int) -> int:
    for attempt in range(10):
        try:
            res = (
                supabase.table("rr_book")
                .select("id")
                .eq("source", "gutenberg")
                .eq("source_id", str(gutenberg_id))
                .limit(1)
                .execute()
            )
            if res.data and res.data[0].get("id"):
                return int(res.data[0]["id"])
        except Exception as e:
            logger.debug(f"get_internal_book_id attempt {attempt}: {e}")
        time.sleep(0.4 + attempt * 0.2)
    raise Exception(f"Could not find internal id for Book #{gutenberg_id}")


def send_discord(added_books: list, errors: list[str]) -> None:
    hook_url = os.getenv("DISCORD_WEBHOOK_URL") or os.getenv("DISCORD_WEBHOOK")
    print("\n--- DISCORD DEBUG ---")
    if hook_url:
        print(f"✅ SECRET FOUND: {hook_url[:35]}...")
    else:
        print("❌ SECRET MISSING: neither DISCORD_WEBHOOK_URL nor DISCORD_WEBHOOK set")
        return

    if added_books:
        msg = (
            f"🚀 **Rocket Readers Update**: Added **{len(added_books)}** new book(s) "
            f"to `rr_book` + queue\n"
            f"_UTC {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}_\n"
        )
        for g_id, title, author in added_books[:15]:
            t = title[:40] + "..." if len(title) > 40 else title
            msg += f"- **#{g_id}** *{t}* — {author}\n"
        if len(added_books) > 15:
            msg += f"_…and {len(added_books) - 15} more_\n"
    else:
        msg = (
            "✅ **Rocket Readers Update**: Check complete — no new English books "
            f"to add.\n_UTC {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}_"
        )

    if errors:
        msg += f"\n⚠️ {len(errors)} error(s) (see Actions log)"

    try:
        response = requests.post(hook_url, json={"content": msg}, timeout=15)
        if not response.ok:
            print(f"❌ DISCORD REJECTED: {response.status_code} - {response.text}")
        response.raise_for_status()
        logger.info("✅ Discord notification sent")
    except Exception as e:
        logger.error(f"❌ Discord failed: {e}")


def update_gutenberg() -> bool:
    log_step("GUTENBERG DAILY UPDATE STARTED (rr_ schema v3)")

    logger.info("📊 Loading existing source_ids (paginated)...")
    existing_ids = fetch_all_existing_source_ids()
    logger.info(f"📊 rr_book already has {len(existing_ids):,} gutenberg source_ids")

    new_books: dict[int, dict] = {}
    year = datetime.now(timezone.utc).year
    logger.info("📥 Fetching GUTINDEX...")
    # Current + previous year (PG rolls GUTINDEX.YYYY)
    for y in (year - 1, year, year + 1):
        new_books.update(parse_gutindex(f"https://www.gutenberg.org/dirs/GUTINDEX.{y}"))

    logger.info("📥 Fetching daily RSS...")
    new_books.update(parse_rss())

    missing = {
        bid: data
        for bid, data in new_books.items()
        if bid not in existing_ids and is_english_lang(data.get("language"))
    }
    logger.info(f"🎯 Found {len(missing):,} new English books to add")

    added_books: list[tuple] = []
    errors: list[str] = []

    for gutenberg_id, meta in sorted(missing.items()):
        try:
            book_payload = {
                "source": "gutenberg",
                "source_id": str(gutenberg_id),
                "title": meta["title"],
                "author": meta["author"],
                "language": meta.get("language") or "en",
                # theme stays null/old until full catalog sync or category assign
            }
            # Partial upsert: do not wipe enrichment on conflict (new rows only in practice)
            supabase.table("rr_book").upsert(
                book_payload, on_conflict="source,source_id"
            ).execute()
            time.sleep(0.35)

            internal_id = get_internal_book_id(gutenberg_id)

            supabase.table("rr_processing_queue").upsert(
                {"book_id": internal_id, "status": "pending"},
                on_conflict="book_id",
            ).execute()

            added_books.append((gutenberg_id, meta["title"], meta["author"]))
            logger.info(
                f"✅ Added #{gutenberg_id} (internal {internal_id}) — {meta['title'][:60]}"
            )
        except Exception as e:
            err = f"#{gutenberg_id}: {e}"
            errors.append(err)
            logger.warning(f"⚠️ Failed to add Book #{gutenberg_id}: {e}")

    send_discord(added_books, errors)
    log_step(
        f"GUTENBERG UPDATE COMPLETE — added {len(added_books)}, errors {len(errors)}"
    )
    return True


if __name__ == "__main__":
    update_gutenberg()
