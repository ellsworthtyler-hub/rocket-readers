-- 2026-11-03  Public listing / search views for non-Gutenberg sources (Wikisource, Wikibooks).
-- Apply manually in the Supabase SQL editor on merge (after 2026-11-03_gutenberg_only_views.sql).
-- Used by: leaderboard source filter, /search (when EXTRA_SOURCES is set).
-- Gutenberg-only leaderboard percentiles stay on library_percentiles (PR A).
--
-- Servable wiki = passed QA 4b, 4c, 4d AND not quarantined AND processed stats.
-- gutenberg_au is deliberately EXCLUDED until the US public-domain gate is turned on
-- (then add: OR (b.source = 'gutenberg_au' AND q.rights_status = 'pass')).
--
-- Definer views so anon can see the *filtered* rows without reading rr_book_qa
-- (RLS on, no policies). Only listing columns are exposed.
-- Rollback:
--   DROP VIEW IF EXISTS public.rr_book_search;
--   DROP VIEW IF EXISTS public.library_percentiles_by_source;
--   DROP VIEW IF EXISTS public.rr_book_listing;
-- Does not touch any og_* table.

BEGIN;

CREATE OR REPLACE VIEW public.rr_book_listing AS
SELECT
  m.book_id,
  b.source,
  b.source_id,
  COALESCE(b.title, '') AS title,
  COALESCE(b.author, '') AS author,
  b.theme,
  m.dolch_percentage,
  m.fry_percentage,
  m.dialog_percentage,
  m.flesch_grade,
  m.flesch_reading_ease,
  m.total_words,
  m.total_sentences,
  m.word_variability_ratio,
  m.avg_word_length,
  m.last_processed
FROM public.rr_book_metadata m
JOIN public.rr_book b ON b.id = m.book_id
JOIN public.rr_book_qa q ON q.book_id = m.book_id
WHERE m.last_processed IS NOT NULL
  AND b.source IN ('wikisource', 'wikibooks')
  AND q.s4b_status = 'pass'
  AND q.s4c_status = 'pass'
  AND q.s4d_status = 'pass'
  AND COALESCE(q.quarantined, false) = false;

-- Combined searchable set: all Gutenberg processed books + servable wiki books.
CREATE OR REPLACE VIEW public.rr_book_search AS
SELECT
  m.book_id,
  b.source,
  b.source_id,
  COALESCE(b.title, '') AS title,
  COALESCE(b.author, '') AS author,
  b.theme,
  m.dolch_percentage,
  m.fry_percentage,
  m.dialog_percentage,
  m.flesch_grade,
  m.flesch_reading_ease,
  m.total_words,
  m.total_sentences,
  m.word_variability_ratio,
  m.avg_word_length,
  m.last_processed
FROM public.rr_book_metadata m
JOIN public.rr_book b ON b.id = m.book_id
WHERE m.last_processed IS NOT NULL
  AND b.source = 'gutenberg'
UNION ALL
SELECT
  book_id, source, source_id, title, author, theme,
  dolch_percentage, fry_percentage, dialog_percentage, flesch_grade,
  flesch_reading_ease, total_words, total_sentences, word_variability_ratio,
  avg_word_length, last_processed
FROM public.rr_book_listing;

CREATE OR REPLACE VIEW public.library_percentiles_by_source AS
WITH base AS (
  SELECT source,
    dolch_percentage::float8 AS dolch,
    fry_percentage::float8 AS fry,
    dialog_percentage::float8 AS dialog,
    flesch_grade::float8 AS flesch_grade,
    flesch_reading_ease::float8 AS flesch_ease
  FROM public.rr_book_listing
)
SELECT
  source,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY dolch) AS dolch_top_5,
  percentile_cont(0.90) WITHIN GROUP (ORDER BY dolch) AS dolch_top_10,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY dolch) AS dolch_top_25,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY dolch) AS dolch_top_50,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY dolch) AS dolch_top_75,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY fry) AS fry_top_5,
  percentile_cont(0.90) WITHIN GROUP (ORDER BY fry) AS fry_top_10,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY fry) AS fry_top_25,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY fry) AS fry_top_50,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY fry) AS fry_top_75,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY dialog) AS dialog_top_5,
  percentile_cont(0.90) WITHIN GROUP (ORDER BY dialog) AS dialog_top_10,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY dialog) AS dialog_top_25,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY dialog) AS dialog_top_50,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY dialog) AS dialog_top_75,
  percentile_cont(0.10) WITHIN GROUP (ORDER BY flesch_grade) AS flesch_top_90,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY flesch_grade) AS flesch_top_75,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY flesch_grade) AS flesch_top_50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY flesch_grade) AS flesch_top_25,
  percentile_cont(0.90) WITHIN GROUP (ORDER BY flesch_ease) AS flesch_ease_top_10,
  count(*)::integer AS sample_size
FROM base
GROUP BY source;

REVOKE ALL ON public.rr_book_listing, public.rr_book_search, public.library_percentiles_by_source FROM anon, authenticated;
GRANT SELECT ON public.rr_book_listing, public.rr_book_search, public.library_percentiles_by_source TO anon, authenticated, service_role;

COMMIT;
