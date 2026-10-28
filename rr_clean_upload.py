#!/usr/bin/env python3
"""rr_clean_upload.py — fetch Gutenberg plain text, strip PG boilerplate, upload to
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
START = re.compile(r"\*\*\*\s*START OF (?:THE |THIS )?(?:PROJECT GUTENBERG|GUTENBERG).*?\*\*\*", re.I | re.S)
END = re.compile(r"\*\*\*\s*END OF (?:THE |THIS )?(?:PROJECT GUTENBERG|GUTENBERG).*?\*\*\*", re.I | re.S)
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
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    m = START.search(text); header = text[:m.start()] if m else text[:3000]
    if m: text = text[m.end():]
    m = END.search(text)
    if m: text = text[:m.start()]
    text = text.translate(str.maketrans({"\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"', "\u00a0": " "}))
    return text.strip() + "\n", header

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

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--ids", nargs="*", type=int); ap.add_argument("--pending", action="store_true")
    a = ap.parse_args(); sb = sb_client(); blocks = block_ids()
    ids = a.ids or []
    if a.pending:
        off = 0
        while True:
            d = sb.table("rr_processing_queue").select("book_id").eq("status", "pending").range(off, off + 999).execute().data
            ids += [r["book_id"] for r in d]; off += 1000
            if len(d) < 1000: break
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
