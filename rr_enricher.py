# FILE: rr_enricher.py — External Enrichment Engine (Open Library + Google Books)
# Phase 0 harden (2026-09-17): null-safe merges, match floors, upsert on_conflict,
# external_ids, backoff, popularity uses log1p(ratings_count).
# Sources beyond OL/GB deferred (Amazon/B&N/Goodreads/Grokipedia = later phases).
#
# Adds ISBN, covers, summaries, ratings, popularity → rr_book + rr_book_enrichment
#
# Schema note:
# Structured columns (openlibrary_data, google_books_data, amazon_data, barnes_noble_data).
# Legacy external_data / enrichment_version are deprecated — do not revive.
import math
import os
import time
import re
from datetime import datetime, timezone
import requests
from dotenv import load_dotenv
from rr_config import supabase, log_step, logger

load_dotenv()

GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY")

# Minimum simple similarity to accept an Open Library / Google match (0–1)
MIN_TITLE_MATCH_SCORE = 0.55
# Short titles (few tokens) need a higher bar + author when present
SHORT_TITLE_TOKEN_MAX = 2
MIN_TITLE_MATCH_SCORE_SHORT = 0.70

NO_MATCH = {"_rr_status": "no_match"}


def _normalize_title(s: str) -> str:
    if not s:
        return ""
    s = s.lower().strip()
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", " ", s)
    for art in ("the ", "a ", "an "):
        if s.startswith(art):
            s = s[len(art):]
            break
    return s.strip()


def _title_tokens(s: str) -> set[str]:
    return {t for t in _normalize_title(s).split() if t}


def _title_match_score(query_title: str, candidate_title: str) -> float:
    """Token Jaccard similarity between titles."""
    a = _title_tokens(query_title)
    b = _title_tokens(candidate_title)
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _min_score_for_title(title: str) -> float:
    toks = _title_tokens(title)
    if len(toks) <= SHORT_TITLE_TOKEN_MAX:
        return MIN_TITLE_MATCH_SCORE_SHORT
    return MIN_TITLE_MATCH_SCORE


def _author_bonus(author: str | None, author_names) -> float:
    if not author or not author_names:
        return 0.0
    auth_blob = " ".join(author_names if isinstance(author_names, list) else [str(author_names)]).lower()
    hits = [tok for tok in _normalize_title(author).split() if len(tok) > 2 and tok in auth_blob]
    return 0.15 if hits else 0.0


def _author_required_ok(author: str | None, author_names, title: str) -> bool:
    """For short titles with a known author, require at least one author token hit."""
    if not author:
        return True
    if len(_title_tokens(title)) > SHORT_TITLE_TOKEN_MAX:
        return True
    return _author_bonus(author, author_names) > 0


def _first_str(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, list):
        for item in value:
            if item is None:
                continue
            s = str(item).strip()
            if s:
                return s
        return None
    s = str(value).strip()
    return s or None


def _pick_isbn(isbn_field) -> str | None:
    candidates = []
    if isbn_field is None:
        return None
    if isinstance(isbn_field, list):
        candidates = [str(x).strip() for x in isbn_field if x]
    else:
        candidates = [str(isbn_field).strip()]

    cleaned = []
    for c in candidates:
        digits = re.sub(r"[^0-9Xx]", "", c)
        if len(digits) in (10, 13):
            cleaned.append(digits.upper() if len(digits) == 10 else digits)

    for c in cleaned:
        if len(c) == 13:
            return c
    return cleaned[0] if cleaned else None


def _as_description(value, max_len: int = 500) -> str | None:
    if value is None:
        return None
    if isinstance(value, list):
        parts = [str(p).strip() for p in value if p]
        text = " ".join(parts)
    else:
        text = str(value).strip()
    if not text:
        return None
    return text[:max_len]


def _popularity_score(avg_rating, ratings_count) -> float:
    if not avg_rating:
        return 0.0
    n = ratings_count or 0
    return round(float(avg_rating) * 20.0 * math.log1p(n) / math.log1p(1000), 2)


def _request_get(url: str, params: dict | None = None, timeout: int = 10, retries: int = 3):
    delay = 1.0
    last_err = None
    for attempt in range(retries):
        try:
            r = requests.get(url, params=params, timeout=timeout)
            if r.status_code == 429 or r.status_code >= 500:
                last_err = f"HTTP {r.status_code}"
                time.sleep(delay)
                delay = min(delay * 2, 8.0)
                continue
            r.raise_for_status()
            return r
        except Exception as e:
            last_err = e
            time.sleep(delay)
            delay = min(delay * 2, 8.0)
    raise RuntimeError(f"GET failed after retries: {last_err}")


def search_open_library(title: str, author: str = None) -> dict | None:
    q = title
    if author:
        q = f"{title} {author}"
    url = "https://openlibrary.org/search.json"
    try:
        r = _request_get(url, params={"q": q, "limit": 5})
        data = r.json()
        docs = data.get("docs") or []
        if not docs:
            return None

        best = None
        best_score = 0.0
        min_score = _min_score_for_title(title)
        for doc in docs:
            cand = doc.get("title") or ""
            score = _title_match_score(title, cand)
            score = min(1.0, score + _author_bonus(author, doc.get("author_name")))
            if not _author_required_ok(author, doc.get("author_name"), title):
                continue
            if score > best_score:
                best_score = score
                best = doc

        if best is None or best_score < min_score:
            logger.info(
                f"Open Library: no confident title match for '{title[:50]}' "
                f"(best_score={best_score:.2f}, min={min_score:.2f})"
            )
            return None
        best["_rr_match_score"] = round(best_score, 3)
        best["_rr_status"] = "ok"
        return best
    except Exception as e:
        logger.warning(f"Open Library error: {e}")
    return None


def search_google_books(isbn: str = None, title: str = None, author: str = None) -> dict | None:
    if not GOOGLE_BOOKS_API_KEY:
        logger.warning("GOOGLE_BOOKS_API_KEY missing — skipping Google Books")
        return None
    if isbn:
        q = f"isbn:{isbn}"
    elif title:
        q = f"intitle:{title}"
        if author:
            q = f"{q}+inauthor:{author}"
    else:
        return None

    url = "https://www.googleapis.com/books/v1/volumes"
    params = {"q": q, "key": GOOGLE_BOOKS_API_KEY, "maxResults": 5}
    try:
        r = _request_get(url, params=params)
        data = r.json()
        items = data.get("items") or []
        if not items:
            return None

        min_score = _min_score_for_title(title or "")
        best_vi = None
        best_score = 0.0
        for item in items:
            vi = item.get("volumeInfo") or {}
            cand_title = vi.get("title") or ""
            if isbn and title:
                score = _title_match_score(title, cand_title)
                score = min(1.0, score + _author_bonus(author, vi.get("authors")))
                if not _author_required_ok(author, vi.get("authors"), title):
                    continue
                if score < min_score:
                    continue
            elif isbn and not title:
                # ISBN-only path without our title: still take first, but tag low confidence
                vi = dict(vi)
                vi["_rr_match_score"] = 0.0
                vi["_rr_status"] = "ok"
                vi["_rr_google_id"] = item.get("id")
                return vi
            else:
                score = _title_match_score(title or "", cand_title)
                score = min(1.0, score + _author_bonus(author, vi.get("authors")))
                if not _author_required_ok(author, vi.get("authors"), title or ""):
                    continue
                if score < min_score:
                    continue
            if score > best_score:
                best_score = score
                best_vi = dict(vi)
                best_vi["_rr_google_id"] = item.get("id")

        if best_vi is None:
            logger.info(
                f"Google Books: no confident match for '{(title or isbn or '')[:50]}' "
                f"(best_score={best_score:.2f}, min={min_score:.2f})"
            )
            return None
        best_vi["_rr_match_score"] = round(best_score, 3)
        best_vi["_rr_status"] = "ok"
        return best_vi
    except Exception as e:
        logger.warning(f"Google Books error: {e}")
    return None


def _merge_scalar(existing, new_value):
    """Never wipe a good prior value with None."""
    if new_value is None or new_value == "":
        return existing
    return new_value


def _source_blob(doc) -> dict:
    if doc is None:
        return dict(NO_MATCH)
    return doc


def enrich_single_book(book_id: int) -> bool:
    """
    Expects internal rr_book.id (PK), not external source_id.
    """
    book_res = supabase.table("rr_book").select("*").eq("id", book_id).single().execute()
    if not book_res.data:
        return False
    book = book_res.data

    meta_res = (
        supabase.table("rr_book_metadata")
        .select("*")
        .eq("book_id", book_id)
        .order("last_processed", desc=True)
        .limit(1)
        .execute()
    )
    meta = meta_res.data[0] if meta_res.data else {}

    title = book["title"]
    author = book.get("author")

    log_step(f"Enriching Book #{book_id} — {title[:60]}...")

    ol_doc = search_open_library(title, author)
    existing_isbn = _first_str(book.get("isbn"))
    gb_doc = search_google_books(
        isbn=existing_isbn,
        title=title if not existing_isbn else title,
        author=author,
    )
    if ol_doc and not existing_isbn:
        ol_isbn = _pick_isbn(ol_doc.get("isbn"))
        if ol_isbn and (not gb_doc or gb_doc.get("_rr_status") != "ok"):
            gb_doc = search_google_books(isbn=ol_isbn, title=title, author=author)

    cover_url = None
    short_desc = None
    avg_rating = None
    ratings_count = None
    ol_key = None
    gb_id = None

    if ol_doc and ol_doc.get("_rr_status") == "ok":
        if ol_doc.get("cover_i"):
            cover_url = f"https://covers.openlibrary.org/b/id/{ol_doc.get('cover_i')}-M.jpg"
        short_desc = _as_description(ol_doc.get("first_sentence") or ol_doc.get("description"))
        ol_key = ol_doc.get("key") or ol_doc.get("cover_edition_key")

    if gb_doc and gb_doc.get("_rr_status") == "ok":
        if not cover_url and gb_doc.get("imageLinks"):
            cover_url = gb_doc.get("imageLinks", {}).get("thumbnail")
        if not short_desc:
            short_desc = _as_description(gb_doc.get("description"))
        avg_rating = gb_doc.get("averageRating")
        ratings_count = gb_doc.get("ratingsCount")
        gb_id = gb_doc.get("_rr_google_id")

    both_failed = (ol_doc is None or ol_doc.get("_rr_status") != "ok") and (
        gb_doc is None or gb_doc.get("_rr_status") != "ok"
    )
    if both_failed:
        logger.info(f"Enrichment miss for Book #{book_id} — both sources failed or no confident match")
        now_iso = datetime.now(timezone.utc).isoformat()
        # Still stamp last_enriched_at so we don't thrash the same miss forever without delay
        supabase.table("rr_book").update({"last_enriched_at": now_iso}).eq("id", book_id).execute()
        supabase.table("rr_book_enrichment").upsert(
            {
                "book_id": book_id,
                "openlibrary_data": _source_blob(ol_doc),
                "google_books_data": _source_blob(gb_doc),
                "last_enriched": now_iso,
            },
            on_conflict="book_id",
        ).execute()
        return False

    popularity_score = _popularity_score(avg_rating, ratings_count)

    resolved_isbn = existing_isbn or (_pick_isbn(ol_doc.get("isbn")) if ol_doc and ol_doc.get("_rr_status") == "ok" else None)
    if not resolved_isbn and gb_doc and gb_doc.get("_rr_status") == "ok":
        for ident in gb_doc.get("industryIdentifiers") or []:
            if ident.get("type") in ("ISBN_13", "ISBN_10") and ident.get("identifier"):
                resolved_isbn = _pick_isbn(ident["identifier"])
                if resolved_isbn:
                    break

    lccn_val = None
    if ol_doc and ol_doc.get("_rr_status") == "ok":
        lccn_val = _first_str(ol_doc.get("lccn"))

    external_ids = dict(book.get("external_ids") or {})
    if ol_key:
        external_ids["openlibrary"] = ol_key
    if gb_id:
        external_ids["google_books"] = gb_id

    now_iso = datetime.now(timezone.utc).isoformat()
    # Preserve existing quality_score when literacy metadata is missing (merge-only).
    meta_has_literacy = any(
        meta.get(k) is not None
        for k in ("dolch_percentage", "fry_percentage", "dialog_percentage", "flesch_reading_ease")
    )
    book_update = {
        "isbn": _merge_scalar(book.get("isbn"), resolved_isbn),
        "lccn": _merge_scalar(book.get("lccn"), lccn_val),
        "cover_url": _merge_scalar(book.get("cover_url"), cover_url),
        "short_description": _merge_scalar(book.get("short_description"), short_desc),
        "external_ids": external_ids,
        "last_enriched_at": now_iso,
    }
    if meta_has_literacy:
        book_update["quality_score"] = round(
            (meta.get("dolch_percentage") or 0) * 0.35
            + (meta.get("fry_percentage") or 0) * 0.25
            + (meta.get("dialog_percentage") or 0) * 0.20
            + (meta.get("flesch_reading_ease") or 70) * 0.10
            + min(popularity_score, 100) * 0.10,
            2,
        )
    # else: leave quality_score untouched on rr_book
    supabase.table("rr_book").update(book_update).eq("id", book_id).execute()

    supabase.table("rr_book_enrichment").upsert(
        {
            "book_id": book_id,
            "openlibrary_data": _source_blob(ol_doc),
            "google_books_data": _source_blob(gb_doc),
            "average_rating": avg_rating,
            "ratings_count": ratings_count,
            "popularity_score": popularity_score,
            "last_enriched": now_iso,
        },
        on_conflict="book_id",
    ).execute()

    logger.info(
        f"✅ Enriched Book #{book_id} | Rating: {avg_rating} | "
        f"Cover: {'✓' if book_update.get('cover_url') else '✗'} | ISBN: {book_update.get('isbn') or '—'}"
    )
    return True


def get_books_needing_enrichment(limit: int = 100) -> list[dict]:
    log_step("Finding books that need external enrichment / re-enrichment...")

    candidates = (
        supabase.table("rr_book")
        .select("id, title, author, source, source_id, added_at, last_enriched_at")
        .order("last_enriched_at", desc=False, nulls_first=True)
        .order("id", desc=False)
        .limit(limit)
        .execute()
        .data
        or []
    )

    needing = candidates[:limit]
    never_enriched = sum(1 for b in needing if not b.get("last_enriched_at"))
    logger.info(
        f"Found {len(needing)} books needing attention "
        f"({never_enriched} never enriched, rest are re-enrichment candidates)."
    )
    return needing


def enrich_batch(limit: int = 100):
    log_step(f"Starting master enrichment batch (max {limit} books)...")

    books = get_books_needing_enrichment(limit)

    if not books:
        logger.info("🎉 All books are already fully enriched (or no candidates found)!")
        return

    logger.info(f"Found {len(books)} books needing enrichment.")

    success = 0
    for book in books:
        if enrich_single_book(book["id"]):
            success += 1
        time.sleep(1.2)

    logger.info(f"Batch complete — {success}/{len(books)} books enriched.")


if __name__ == "__main__":
    enrich_batch(limit=100)
