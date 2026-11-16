"""Offline unit tests for rr_sot_guard (no network): python -m pytest tests/py -q"""
import os, sys, pathlib
HERE = pathlib.Path(__file__).parent
os.environ["RR_PG_CATALOG"] = str(HERE / "fixtures" / "pg_catalog_min.csv")
os.utime(os.environ["RR_PG_CATALOG"])  # keep cache 'fresh' so no download
sys.path.insert(0, str(HERE.parent.parent))
import rr_sot_guard as g

def hdr(n, title, start=None):
    return (f"The Project Gutenberg eBook of {title}\n\nTitle: {title}\n\nRelease date: 2000 [eBook #{n}]\n\n"
            f"*** START OF THE PROJECT GUTENBERG EBOOK {start or title.upper()} ***\nbody text\n")

def test_good():
    assert g.check("11", hdr(11, "Alice's Adventures in Wonderland"), "x", "Alice's Adventures in Wonderland") == (True, "ok")

def test_numeric_title_not_an_id():
    assert g.check("1692", hdr(1692, "1492", "1492"), "x", "1492")[0]

def test_forward_fill_header_mismatch():
    ok, why = g.check("37157", hdr(37156, "Ireland in the Days of Dean Swift"), "x", "Science and Hypothesis")
    assert not ok and why.startswith("header_id_37156")

def test_sound_item_rejected():
    ok, why = g.check("22963", hdr(22961, "Nell, of Shorne Mills"), "x", "Persuasion")
    assert not ok and why == "catalog_type_Sound"

def test_title_mismatch_without_id():
    raw = "Title: Nell, of Shorne Mills\n\n*** START OF THE PROJECT GUTENBERG EBOOK NELL ***\n"
    ok, why = g.check("37157", raw, "x", "Science and Hypothesis")
    assert not ok and why.startswith("title_mismatch")

def test_duplicate_sha():
    seen = {}
    assert g.check("11", "", "same body", None, seen_sha=seen)[0]
    ok, why = g.check("22961", "", "same body", None, seen_sha=seen)
    assert not ok and why == "duplicate_of_11"
