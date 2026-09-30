-- Optional: materialize badge percentiles from rr_book_metadata
-- Apply in Supabase SQL Editor when enough books are processed.
-- Consumers: home / search / leaderboard (library_percentiles table or view).

-- Drop view if switching from an older definition
DROP VIEW IF EXISTS public.library_percentiles;

CREATE OR REPLACE VIEW public.library_percentiles AS
WITH base AS (
  SELECT
    dolch_percentage::float8 AS dolch,
    fry_percentage::float8 AS fry,
    dialog_percentage::float8 AS dialog,
    flesch_grade::float8 AS flesch_grade,
    flesch_reading_ease::float8 AS flesch_ease
  FROM public.rr_book_metadata
  WHERE last_processed IS NOT NULL
)
SELECT
  -- Higher-is-better metrics: top_N ≈ high percentiles
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

  -- Flesch grade: lower is better. BookCard uses flesch_top_90 as "easiest 10%" threshold.
  percentile_cont(0.10) WITHIN GROUP (ORDER BY flesch_grade) AS flesch_top_90,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY flesch_grade) AS flesch_top_75,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY flesch_grade) AS flesch_top_50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY flesch_grade) AS flesch_top_25,

  percentile_cont(0.90) WITHIN GROUP (ORDER BY flesch_ease) AS flesch_ease_top_10,
  count(*)::int AS sample_size
FROM base;

GRANT SELECT ON public.library_percentiles TO anon, authenticated, service_role;
