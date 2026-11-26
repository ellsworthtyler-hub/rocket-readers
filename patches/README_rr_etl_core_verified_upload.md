# rr_etl_core.py — verified analysis upload (patch for the PC copy)

`rr_etl_core.py` lives only on Tyler's PC (`C:\Users\ellsw\LiteracyProject`), so it is not in this repo.
This patch is against the 11/22/2026 PC version (41,643 bytes, CRLF). **Nobody has applied it.** Tyler applies it himself after review:

```powershell
cd C:\Users\ellsw\LiteracyProject
Copy-Item rr_etl_core.py rr_etl_core.py.bak-YYYYMMDD
Copy-Item <repo>\rr_analysis_io.py .
git apply --check <repo>\patches\rr_etl_core_verified_upload.patch   # or: patch --binary -p1 < ...
git apply <repo>\patches\rr_etl_core_verified_upload.patch
```

What changes:
- R2 analysis upload goes through `rr_analysis_io.put_analysis_verified()`: PUT, then HEAD, checking size, ETag(md5) and sha256 metadata, with retries.
- `_save_book_metadata(..., has_analysis_file=...)` now writes `has_analysis_file=True` **only** when that upload verified. Local-only runs and failed uploads write `False`.
- The normal ETL path keeps `overwrite=True` (reprocessing a book replaces its analysis). Recovery jobs use `overwrite=False`.

Audit (read-only): `python scripts/rr_analysis_audit.py --out missing.jsonl` must report `missing: 0`.

Background: 24,486 books were flagged `has_analysis_file=true` with no `{art_id}_analysis.json` in R2 (found Nov 26, 2026).
