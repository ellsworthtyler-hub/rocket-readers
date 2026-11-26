#!/usr/bin/env python3
"""rr_analysis_audit.py — READ-ONLY audit: every has_analysis_file=true book must have its R2 object.

  python scripts/rr_analysis_audit.py [--out missing.jsonl]

Lists rr-analysis-data once, pages rr_book_metadata (has_analysis_file=true) joined to rr_book, and
prints flagged-but-missing counts per source. Exit code 1 if anything is missing. Makes no writes.
"""
from __future__ import annotations

import argparse
import collections
import json
import sys

from rr_config import BUCKET_ANALYSIS, r2_client, supabase

try:
    from rr_config import artifact_key_id
except ImportError:  # older rr_config (repo copy) — same rule as the PC's rr_config
    def artifact_key_id(source, source_id):
        sid = str(source_id)
        return sid if not source or source == "gutenberg" else f"{source}_{sid}"


def r2_keys() -> set[str]:
    keys: set[str] = set()
    for page in r2_client.get_paginator("list_objects_v2").paginate(Bucket=BUCKET_ANALYSIS):
        for o in page.get("Contents", []) or []:
            k = o["Key"]
            if k.endswith("_analysis.json") and not k.startswith("backup/"):
                keys.add(k)
    return keys


def flagged_books():
    start, page = 0, 1000
    while True:
        res = (supabase.table("rr_book_metadata")
               .select("book_id,rr_book(source,source_id)")
               .eq("has_analysis_file", True).order("book_id")
               .range(start, start + page - 1).execute())
        rows = res.data or []
        for r in rows:
            b = r.get("rr_book") or {}
            b = b[0] if isinstance(b, list) and b else b
            yield r["book_id"], b.get("source") or "gutenberg", str(b.get("source_id") or "")
        if len(rows) < page:
            return
        start += page


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="")
    a = ap.parse_args()
    keys = r2_keys()
    total, missing = 0, []
    for bid, src, sid in flagged_books():
        total += 1
        key = f"{artifact_key_id(src, sid)}_analysis.json"
        if key not in keys:
            missing.append({"book_id": bid, "source": src, "source_id": sid, "key": key})
    by = collections.Counter(m["source"] for m in missing)
    print(json.dumps({"r2_objects": len(keys), "flagged_true": total, "missing": len(missing), "by_source": by}))
    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            for m in missing:
                f.write(json.dumps(m) + "\n")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
