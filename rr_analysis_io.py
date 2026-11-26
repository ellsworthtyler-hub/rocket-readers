# FILE: rr_analysis_io.py — verified analysis-JSON upload for the ETL (Nov 26, 2026)
"""
Why: rr_etl_core.process_book() swallowed R2 upload errors (logger.warning only) and
_save_book_metadata() then always wrote has_analysis_file=True. 24,486 books ended up flagged
with no {art_id}_analysis.json in R2 (Wikisource 18,019 / Gutenberg AU 2,965 / Wikibooks 2,565 /
Gutenberg US 937).

put_analysis_verified() uploads and proves the object landed:
  * never overwrites by default (If-None-Match: *),
  * HEAD after PUT, checks ContentLength == len(body), ETag == md5(body) (single-part PUT),
    and the sha256 stored in object metadata,
  * returns an AnalysisUpload record; callers set has_analysis_file from `.verified` only.
"""
from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass

DEFAULT_BUCKET = "rr-analysis-data"


@dataclass
class AnalysisUpload:
    key: str
    verified: bool
    bytes: int
    sha256: str
    md5: str
    error: str | None = None
    skipped_existing: bool = False


def analysis_key(art_id: str) -> str:
    """art_id must already be prefixed for non-Gutenberg sources (rr_config.artifact_key_id)."""
    return f"{art_id}_analysis.json"


def _code(err: Exception) -> str:
    resp = getattr(err, "response", None) or {}
    return str((resp.get("Error") or {}).get("Code") or "")


def head_ok(r2_client, key: str, size: int, md5: str, sha256: str, bucket: str = DEFAULT_BUCKET) -> bool:
    h = r2_client.head_object(Bucket=bucket, Key=key)
    return (
        int(h.get("ContentLength", -1)) == size
        and str(h.get("ETag", "")).strip('"') == md5
        and (h.get("Metadata") or {}).get("sha256") == sha256
    )


def put_analysis_verified(
    r2_client,
    art_id: str,
    body: bytes | str,
    *,
    bucket: str = DEFAULT_BUCKET,
    overwrite: bool = False,
    retries: int = 3,
) -> AnalysisUpload:
    data = body.encode("utf-8") if isinstance(body, str) else body
    key = analysis_key(art_id)
    sha = hashlib.sha256(data).hexdigest()
    md5 = hashlib.md5(data).hexdigest()
    last = None
    for attempt in range(1, retries + 1):
        try:
            if not overwrite:
                try:
                    r2_client.head_object(Bucket=bucket, Key=key)
                    return AnalysisUpload(key, False, len(data), sha, md5, "exists", skipped_existing=True)
                except Exception as e:  # noqa: BLE001
                    if _code(e) not in ("404", "NoSuchKey", "NotFound"):
                        raise
            kwargs = dict(Bucket=bucket, Key=key, Body=data, ContentType="application/json",
                          Metadata={"sha256": sha})
            if not overwrite:
                kwargs["IfNoneMatch"] = "*"
            r2_client.put_object(**kwargs)
            if head_ok(r2_client, key, len(data), md5, sha, bucket):
                return AnalysisUpload(key, True, len(data), sha, md5)
            last = "verify_mismatch"
        except Exception as e:  # noqa: BLE001
            last = f"{type(e).__name__}: {e}"
        time.sleep(2 * attempt)
    return AnalysisUpload(key, False, len(data), sha, md5, last)
