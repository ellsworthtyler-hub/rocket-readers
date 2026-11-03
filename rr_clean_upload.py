#!/usr/bin/env python3
"""rr_clean_upload.py (v2 cleaner 2026-10-28; --reclean-flagged / --reclean-ids) — fetch Gutenberg plain text, strip PG boilerplate, upload to
Supabase storage cleaned-books/{source_id}.txt. Skips non-PD: Steward BLOCK list,
Vaknin, and any PG header saying the eBook is copyrighted.
Usage: rr_clean_upload.py --pending   (all pending gutenberg queue books lacking cleaned text)
       rr_clean_upload.py --ids 194626 194627 ...  (rr_book.id)
"""
from __future__ import annotations
import argparse, os, re, sys, time, json, urllib.request, urllib.error
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(os.environ.get("RR_ENV", "/workspace/smoke_phase0/LiteracyProject.env"))
for _k in list(os.environ):
    os.environ[_k] = os.environ[_k].strip()
from supabase import create_client

BUCKET = "cleaned-books"
UA = "RocketReadersPipeline/1.0 (educational; polite-bot)"
BLOCK_FILE = Path(os.environ.get("RR_BLOCK_FILE") or Path(__file__).with_name("data") / "steward_block_source_ids.txt")
START = re.compile(r"\*{3}\s*START OF (?:THE |THIS )?(?:PROJECT GUTENBERG|GUTENBERG)[^*]*\*{3}", re.I | re.S)
END = re.compile(r"\*{3}\s*END OF (?:THE |THIS )?(?:PROJECT GUTENBERG|GUTENBERG)[^*]*\*{3}", re.I | re.S)
# v2 (2026-10-28): extra boilerplate patterns seen in QA 4b boilerplate failures
OLD_SMALL_PRINT_END = re.compile(r"\*?END\*?\s*THE SMALL PRINT!?[^\n]*\n", re.I)
END_FALLBACKS = [
    re.compile(r"^\s*End of (?:the |this )?Project Gutenberg'?s?\b[^\n]*$", re.I | re.M),
    re.compile(r"^\s*\*{3}\s*END OF[^\n]*$", re.I | re.M),
    re.compile(r"^\s*\*{3}\s*FINIS\s*\*{3}", re.I | re.M),
    re.compile(r"^[^\n]*This file should be named [^\n]*$", re.I | re.M),
    re.compile(r"^\s*\*{3}\s*START: FULL LICENSE", re.I | re.M),
    re.compile(r"^\s*THE FULL PROJECT GUTENBERG LICENSE", re.I | re.M),
]
HEADER_REMNANT = re.compile(r"\A\s*(?:[^\n]*\bE-?BOOK\b[^\n]*\*{3}\s*)", re.I)
PRODUCED_BY = re.compile(r"\A\s*(?:(?:Produced|Prepared|Transcribed|E-?text prepared) by[^\n]*(?:\n[^\n]+){0,4}\n\s*\n)", re.I)
COPYRIGHT_HDR = re.compile(r"copyrighted project gutenberg|this (?:e-?book|work) is copyrighted|copyright \(c\)|all rights reserved", re.I)

def sb_client():
    return create_client(os.environ["NEXT_PUBLIC_SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

def block_ids() -> set[str]:
    if not BLOCK_FILE.exists(): return set()
    return {l.split()[0] for l in BLOCK_FILE.read_text(errors="replace").splitlines() if l.strip() and not l.startswith("#")}

def fetch(sid: str) -> str | None:
    for url in (f"https://www.gutenberg.org/cache/epub/{sid}/pg{sid}.txt",
                f"https://www.gutenberg.org/files/{sid}/{sid}-0.txt",
                f"https://www.gutenberg.org/files/{sid}/{sid}.txt"):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60) as r:
                raw = r.read()
            try: t = raw.decode("utf-8-sig")
            except UnicodeDecodeError: t = raw.decode("latin-1")
            if len(t) > 200: return t
        except Exception:
            continue
    return None

def clean(text: str) -> tuple[str, str]:
    """Strip PG header/footer/license. Returns (body, header). v2 handles legacy small-print
    headers, missing *** END markers, FINIS/"file should be named" trailers, header remnants
    (e.g. "EBOOK TITLE ***") and leading "Produced by" credits."""
    text = text.replace("\r\n", "\n").replace("\r", "\n").lstrip("\ufeff")
    m = START.search(text)
    if not m:
        m = OLD_SMALL_PRINT_END.search(text[:40000])
    header = text[:m.start()] if m else text[:3000]
    if m: text = text[m.end():]
    m = END.search(text)
    if m:
        text = text[:m.start()]
    else:
        cut = len(text)
        for pat in END_FALLBACKS:
            mm = pat.search(text, len(text) // 3)
            if mm: cut = min(cut, mm.start())
        text = text[:cut]
    for _ in range(2):
        text = HEADER_REMNANT.sub("", text, count=1)
        text = PRODUCED_BY.sub("", text, count=1)
    text = text.translate(str.maketrans({"\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"', "\u00a0": " "}))
    return text.strip() + "\n", header

def boilerplate_left(body: str) -> bool:
    low = body.lower()
    return low.count("project gutenberg") >= 8 or "full project gutenberg-tm license" in low or bool(START.search(body))

def exists(sb, key: str) -> bool:
    try: return len(sb.storage.from_(BUCKET).download(key)) > 50
    except Exception: return False

def process(sb, book: dict, blocks: set[str]) -> str:
    sid = str(book["source_id"]); key = f"{sid}.txt"
    if book.get("source") != "gutenberg": return "skip:not_gutenberg"
    if sid in blocks or "vaknin" in f"{book.get('title')} {book.get('author')}".lower(): return "skip:blocked_non_pd"
    if exists(sb, key): return "exists"
    raw = fetch(sid)
    if not raw: return "fail:download"
    body, header = clean(raw)
    if COPYRIGHT_HDR.search(header): return "skip:copyright_header"
    if len(body) < 500: return "fail:too_short"
    opts = {"content-type": "text/plain; charset=utf-8", "upsert": "true"}
    sb.storage.from_(BUCKET).upload(key, body.encode("utf-8"), file_options=opts)
    return "uploaded" if exists(sb, key) else "fail:verify"

RECLEAN_BACKUP = Path(os.environ.get("RR_RECLEAN_BACKUP", "/workspace/backups/cleaned-books-reclean"))

def reclean(sb, book: dict, blocks: set[str]) -> str:
    """Re-clean an existing SoT (backup old copy locally first); re-download if needed. Re-queues analysis."""
    sid = str(book["source_id"]); key = f"{sid}.txt"
    if book.get("source") != "gutenberg": return "skip:not_gutenberg"
    if sid in blocks: return "skip:blocked_non_pd"
    try: old = sb.storage.from_(BUCKET).download(key).decode("utf-8", "replace")
    except Exception: old = ""
    if old:
        RECLEAN_BACKUP.mkdir(parents=True, exist_ok=True)
        (RECLEAN_BACKUP / key).write_text(old, encoding="utf-8")
    body, header = clean(old) if old else ("", "")
    if not old or boilerplate_left(body) or len(body) < 500:
        raw = fetch(sid)
        if not raw: return "fail:download"
        body, header = clean(raw)
    if COPYRIGHT_HDR.search(header): return "skip:copyright_header"
    if boilerplate_left(body): return "fail:boilerplate_remains"
    if len(body) < 200: return "fail:too_short"
    sb.storage.from_(BUCKET).upload(key, body.encode("utf-8"), file_options={"content-type": "text/plain; charset=utf-8", "upsert": "true"})
    sb.table("rr_processing_queue").upsert({"book_id": book["id"], "status": "pending", "worker_id": None, "started_at": None,
                                             "completed_at": None, "error_message": None, "priority": 5}, on_conflict="book_id").execute()
    return "recleaned"

def flagged_ids(sb) -> list[int]:
    ids, last = [], -1
    while True:
        d = (sb.table("rr_book_qa").select("book_id").eq("s4b_reason", "boilerplate_needs_reclean")
             .gt("book_id", last).order("book_id").limit(1000).execute().data)
        if not d: return ids
        ids += [r["book_id"] for r in d]; last = d[-1]["book_id"]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--ids", nargs="*", type=int); ap.add_argument("--pending", action="store_true")
    ap.add_argument("--reclean-flagged", action="store_true", help="re-clean books QA 4b flagged boilerplate_needs_reclean")
    ap.add_argument("--reclean-ids", nargs="*", type=int)
    a = ap.parse_args(); sb = sb_client(); blocks = block_ids()
    ids = a.ids or []
    if a.pending:
        off = 0
        while True:
            d = sb.table("rr_processing_queue").select("book_id").eq("status", "pending").range(off, off + 999).execute().data
            ids += [r["book_id"] for r in d]; off += 1000
            if len(d) < 1000: break
    rc_ids = (a.reclean_ids or []) + (flagged_ids(sb) if a.reclean_flagged else [])
    if rc_ids:
        from datetime import datetime, timezone
        res = {}
        for i in range(0, len(rc_ids), 100):
            for b in sb.table("rr_book").select("id,source,source_id,title,author").in_("id", rc_ids[i:i+100]).execute().data:
                r = reclean(sb, b, blocks); res[b["id"]] = r
                ts = datetime.now(timezone.utc).isoformat()
                sb.table("rr_qa_events").insert({"book_id": b["id"], "stage": "reclean", "result": "pass" if r == "recleaned" else "fail",
                                                 "reason": r, "run_id": "reclean_" + ts[:10], "created_at": ts}).execute()
                upd = {"s4b_status": "pending", "s4b_reason": "recleaned_awaiting_qa", "current_stage": "4b"} if r == "recleaned" \
                    else {"s4b_status": "fail", "s4b_reason": "reclean_" + r.replace(":", "_"), "needs_human": True}
                sb.table("rr_book_qa").update(upd).eq("book_id", b["id"]).execute()
                print(f"{b['id']} pg{b['source_id']} {r}", flush=True)
        from collections import Counter
        print("RECLEAN_SUMMARY", json.dumps(Counter(res.values())))
        if not ids: return res
    res = {}
    for i in range(0, len(ids), 100):
        for b in sb.table("rr_book").select("id,source,source_id,title,author").in_("id", ids[i:i+100]).execute().data:
            r = process(sb, b, blocks); res[b["id"]] = r
            print(f"{b['id']} pg{b['source_id']} {r}", flush=True)
            if r == "uploaded": time.sleep(0.75)
    from collections import Counter
    print("SUMMARY", json.dumps(Counter(res.values())))
    return res

if __name__ == "__main__":
    main()
