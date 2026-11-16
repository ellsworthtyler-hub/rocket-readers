#!/usr/bin/env python3
"""rr_sot_guard.py — PROPOSED (not deployed). Identity gate for Gutenberg US source-of-truth text.

Root cause it prevents: the Apr-26-2026 bulk upload copied a third-party Gutenberg dump in which every
ID without a plain-text file (audio books, datasets, PDF/TeX-only works) held the text of the nearest
lower ID (forward-fill). Nothing between the raw file and cleaned-books/{id}.txt checked identity.

Checks (all cheap, no network unless catalog refresh):
  1. catalog type: PG pg_catalog.csv Type must be 'Text' (rejects Sound/Dataset/Image/MovingImage/Collection)
  2. header id: the PG header / START marker eBook number, when present, must equal the requested id
  3. title: header 'Title:' (or START-marker label) fuzzy-matches rr_book.title (token_set >= 60)
  4. duplicate: sha256 of the first 64 KB of the cleaned body must not already belong to another id
Returns (ok, reason). Callers must treat ok=False as 'do not upload; mark needs_human'.
"""
from __future__ import annotations
import csv, hashlib, os, re, tempfile, time, urllib.request
from pathlib import Path

CATALOG_URL = "https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv"
CATALOG_CACHE = Path(os.environ.get("RR_PG_CATALOG") or os.path.join(tempfile.gettempdir(), "rr_pg_catalog.csv"))
# Order matters: '[eBook #N]' is authoritative; the START marker carries the *title*, which can be a
# number (PG #1692 is titled '1492'), so it is only a last resort and is skipped when it equals the title.
HDR_ID = [re.compile(r"\[E-?(?:Book|Text)\s*#\s*(\d+)\]", re.I),
          re.compile(r"\bE-?(?:Book|Text)\s*#\s*(\d+)\b", re.I),
          re.compile(r"\*{3}\s*START OF (?:THE |THIS )?PROJECT GUTENBERG E-?BOOK\s+(\d+)\s*\*{3}", re.I)]
HDR_TITLE = re.compile(r"^\s*Title:\s*(.+?)\s*$", re.I | re.M)
START_LABEL = re.compile(r"\*{3}\s*START OF (?:THE |THIS )?PROJECT GUTENBERG E-?BOOK\s+(?!\d+\s*\*)(.+?)\s*\*{3}", re.I)
_STOP = {"a", "an", "the", "of", "and", "or", "to", "in", "on", "for", "by", "with", "vol", "volume"}

def _load_catalog(max_age_h: float = 24.0) -> dict[str, dict]:
    if not CATALOG_CACHE.exists() or time.time() - CATALOG_CACHE.stat().st_mtime > max_age_h * 3600:
        CATALOG_CACHE.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(CATALOG_URL, headers={"User-Agent": "RocketReadersPipeline/1.0"})
        CATALOG_CACHE.write_bytes(urllib.request.urlopen(req, timeout=120).read())
    with CATALOG_CACHE.open(encoding="utf-8") as f:
        return {r["Text#"]: r for r in csv.DictReader(f)}

_CAT: dict[str, dict] | None = None
def catalog_type(sid: str) -> str | None:
    global _CAT
    if _CAT is None:
        try: _CAT = _load_catalog()
        except Exception: _CAT = {}   # catalog unreachable: fail open on type only; id/title/dup checks still apply

    r = _CAT.get(str(sid)); return r.get("Type") if r else None

def _toks(s: str) -> set[str]:
    return {w for w in re.findall(r"[a-z0-9]+", (s or "").lower()) if w not in _STOP}

def title_sim(a: str, b: str) -> float:
    A, B = _toks(a), _toks(b)
    if not A or not B: return 0.0
    return 100.0 * len(A & B) / min(len(A), len(B))     # token-set containment

def header_id(header: str) -> str | None:
    """eBook number from the PG header. Ignores 'EBook of 1492' style titles (number must follow '#' or be the START id)."""
    for rx in HDR_ID:
        m = rx.search(header[:20000])
        if m: return m.group(1)
    return None

def opening_sha(body: str) -> str:
    return hashlib.sha256(body[:65536].encode("utf-8", "replace")).hexdigest()

def check(sid: str, raw: str, body: str, title: str | None, *, seen_sha: dict[str, str] | None = None,
          min_title_sim: float = 60.0) -> tuple[bool, str]:
    sid = str(sid)
    t = catalog_type(sid)
    if t is not None and t != "Text":
        return False, f"catalog_type_{t}"
    head = raw[:20000]
    hid = header_id(head)
    if hid and title and re.fullmatch(r"\s*" + hid + r"\b.*", title or "", re.S) and not re.search(r"#\s*" + hid + r"\b", head):
        hid = None                                   # numeric title, not an id
    if hid and hid != sid:
        return False, f"header_id_{hid}_ne_{sid}"
    ht = HDR_TITLE.search(head); lbl = START_LABEL.search(head)
    cand = (ht.group(1) if ht else None) or (lbl.group(1) if lbl else None)
    if title and cand and title_sim(cand, title) < min_title_sim:
        return False, f"title_mismatch:{cand[:60]!r}"
    if seen_sha is not None:
        h = opening_sha(body); other = seen_sha.get(h)
        if other and other != sid:
            return False, f"duplicate_of_{other}"
        seen_sha[h] = sid
    return True, "ok"
