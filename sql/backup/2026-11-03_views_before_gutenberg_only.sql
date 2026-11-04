-- ROLLBACK / BACKUP: live definitions captured read-only from Supabase mckxrkpmlgbgyaujhbuu
-- on 2026-11-03 (before sql/2026-11-03_gutenberg_only_views.sql).
-- Grants at capture time: library_percentiles + rr_book_pos_search: anon, authenticated, service_role (all);
-- rr_quarantined_source_ids: service_role only. rr_book_pos_search had reloptions security_invoker=true.
-- To roll back: run this file, then DROP VIEW IF EXISTS public.rr_quarantined_book_refs;

CREATE OR REPLACE VIEW public.library_percentiles AS
 WITH base AS (
         SELECT (rr_book_metadata.dolch_percentage)::double precision AS dolch,
            (rr_book_metadata.fry_percentage)::double precision AS fry,
            (rr_book_metadata.dialog_percentage)::double precision AS dialog,
            (rr_book_metadata.flesch_grade)::double precision AS flesch_grade,
            (rr_book_metadata.flesch_reading_ease)::double precision AS flesch_ease
           FROM rr_book_metadata
          WHERE (rr_book_metadata.last_processed IS NOT NULL)
        )
 SELECT percentile_cont((0.95)::double precision) WITHIN GROUP (ORDER BY dolch) AS dolch_top_5,
    percentile_cont((0.90)::double precision) WITHIN GROUP (ORDER BY dolch) AS dolch_top_10,
    percentile_cont((0.75)::double precision) WITHIN GROUP (ORDER BY dolch) AS dolch_top_25,
    percentile_cont((0.50)::double precision) WITHIN GROUP (ORDER BY dolch) AS dolch_top_50,
    percentile_cont((0.25)::double precision) WITHIN GROUP (ORDER BY dolch) AS dolch_top_75,
    percentile_cont((0.95)::double precision) WITHIN GROUP (ORDER BY fry) AS fry_top_5,
    percentile_cont((0.90)::double precision) WITHIN GROUP (ORDER BY fry) AS fry_top_10,
    percentile_cont((0.75)::double precision) WITHIN GROUP (ORDER BY fry) AS fry_top_25,
    percentile_cont((0.50)::double precision) WITHIN GROUP (ORDER BY fry) AS fry_top_50,
    percentile_cont((0.25)::double precision) WITHIN GROUP (ORDER BY fry) AS fry_top_75,
    percentile_cont((0.95)::double precision) WITHIN GROUP (ORDER BY dialog) AS dialog_top_5,
    percentile_cont((0.90)::double precision) WITHIN GROUP (ORDER BY dialog) AS dialog_top_10,
    percentile_cont((0.75)::double precision) WITHIN GROUP (ORDER BY dialog) AS dialog_top_25,
    percentile_cont((0.50)::double precision) WITHIN GROUP (ORDER BY dialog) AS dialog_top_50,
    percentile_cont((0.25)::double precision) WITHIN GROUP (ORDER BY dialog) AS dialog_top_75,
    percentile_cont((0.10)::double precision) WITHIN GROUP (ORDER BY flesch_grade) AS flesch_top_90,
    percentile_cont((0.25)::double precision) WITHIN GROUP (ORDER BY flesch_grade) AS flesch_top_75,
    percentile_cont((0.50)::double precision) WITHIN GROUP (ORDER BY flesch_grade) AS flesch_top_50,
    percentile_cont((0.75)::double precision) WITHIN GROUP (ORDER BY flesch_grade) AS flesch_top_25,
    percentile_cont((0.90)::double precision) WITHIN GROUP (ORDER BY flesch_ease) AS flesch_ease_top_10,
    (count(*))::integer AS sample_size
   FROM base;

CREATE OR REPLACE VIEW public.rr_book_pos_search WITH (security_invoker = true) AS
 SELECT b.source_id,
    COALESCE(b.title, ''::text) AS title,
    COALESCE(b.author, ''::text) AS author,
    s.count_nouns, s.count_verbs, s.count_adjectives, s.count_adverbs, s.count_prepositions, s.pos_total,
    CASE WHEN (s.pos_total = 0) THEN (0)::double precision ELSE ((s.count_nouns)::double precision / (s.pos_total)::double precision) END AS noun_pct,
    CASE WHEN (s.pos_total = 0) THEN (0)::double precision ELSE ((s.count_verbs)::double precision / (s.pos_total)::double precision) END AS verb_pct,
    CASE WHEN (s.pos_total = 0) THEN (0)::double precision ELSE ((s.count_adjectives)::double precision / (s.pos_total)::double precision) END AS adj_pct,
    CASE WHEN (s.pos_total = 0) THEN (0)::double precision ELSE ((s.count_adverbs)::double precision / (s.pos_total)::double precision) END AS adv_pct,
    CASE WHEN (s.pos_total = 0) THEN (0)::double precision ELSE ((s.count_prepositions)::double precision / (s.pos_total)::double precision) END AS prep_pct
   FROM (( SELECT m.book_id,
            COALESCE(m.count_nouns, 0) AS count_nouns,
            COALESCE(m.count_verbs, 0) AS count_verbs,
            COALESCE(m.count_adjectives, 0) AS count_adjectives,
            COALESCE(m.count_adverbs, 0) AS count_adverbs,
            COALESCE(m.count_prepositions, 0) AS count_prepositions,
            ((((COALESCE(m.count_nouns, 0) + COALESCE(m.count_verbs, 0)) + COALESCE(m.count_adjectives, 0)) + COALESCE(m.count_adverbs, 0)) + COALESCE(m.count_prepositions, 0)) AS pos_total
           FROM rr_book_metadata m
          WHERE (m.last_processed IS NOT NULL)) s
     JOIN rr_book b ON ((b.id = s.book_id)));

CREATE OR REPLACE VIEW public.rr_quarantined_source_ids AS
 SELECT q.source_id, q.quarantine_reason
   FROM (rr_book_qa q JOIN rr_book b ON ((b.id = q.book_id)))
  WHERE (q.quarantined AND (b.source = 'gutenberg'::text));
