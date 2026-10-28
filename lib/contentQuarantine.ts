/**
 * Contaminated enhanced-reader SoT keys (Library Steward / Pipeline).
 * Mislabeled HTML under these Gutenberg source_ids must not reach public
 * library, reader, packet, or teacher-facing surfaces.
 *
 * Bible: never host wrong/copyrighted text; publish EPUB/HTML only with Tyler+QA.
 * Steward signed remaps in progress — expand/shrink this list when they clear keys.
 *
 * Signed BLOCK:
 * - inclusive range 9001–9042
 * - singletons 12701, 12711, 23935
 * - inclusive range 12719–12724 (RTF-pointer stubs)
 * - Vaknin/Rangelovska copyrighted set (BATCH25N_VAKNIN_COPYRIGHTED.md)
 * - Aesop PG Sound indexes 19617–19627 (audio-only; remapped → 11339)
 * - Bad-stats audit 2026-10-17: audio-only / no-text ids whose SoT is another book, + 15 PG stubs (DRAFT)
 */

// QA auto-quarantine snapshot (rr_book_qa.quarantined; regenerate with qa-restart/export_quarantine.py).
import qaQuarantineIds from '@/data/qa_quarantine_source_ids.json';
const QA_QUARANTINE = new Set<number>(qaQuarantineIds as number[]);

const QUARANTINED_SINGLETONS = new Set<number>([
  12701,
  12711,
  23935, // batch25m: catalogued Sonnet 23 but SoT body is Instinct; PG 23935 audio-only
  // Vaknin / Rangelovska — PG Copyright field = Copyrighted (not PD)
  4663,
  4742,
  5887,
  8214,
  8216,
  8218,
  8420,
  8421,
  14557,
  28363,
  28409,
]);

const QUARANTINE_RANGES: [number, number][] = [
  [9001, 9042],
  [12719, 12724],
  [19617, 19627], // Aesop PG Sound (not text)
];

// Bad-stats audit 2026-10-17 (DRAFT, pending Tyler review): 890 Gutenberg source_ids
// whose cleaned SoT is another book's text (PG Sound/audiobook ids, or PDF/TeX-only
// ids), plus 15 PG HTML-only placeholder stubs (American Historical and Literary
// Curiosities parts; Copyright Renewals 1953-1960). Stats are wrong; no correct text in SoT.
// Evidence: qa-smoke/badstats/flagged.csv (final_action=quarantine).
const BADSTATS_20261017_SINGLETONS = new Set<number>([
  6161, 7902, 7904, 7907, 7911, 7913, 7915, 9056, 9143, 10227,
  10277, 10524, 20026, 20028, 20030, 20677, 20691, 21146, 21184, 22785,
  29779, 29782,
]);

const BADSTATS_20261017_RANGES: [number, number][] = [
  [6348, 6349], [6419, 6420], [6532, 6548], [6550, 6557], [7872, 7874],
  [7917, 7920], [8204, 8205], [8608, 8637], [8748, 8769], [8806, 8812],
  [8816, 8818], [8958, 8960], [8965, 8990], [9113, 9114], [9145, 9147],
  [9268, 9293], [9336, 9361], [9416, 9438], [9451, 9452], [9510, 9541],
  [9551, 9558], [9671, 9699], [9702, 9744], [9933, 9934], [10152, 10155],
  [10157, 10158], [10167, 10200], [10203, 10209], [10229, 10233], [10235, 10250],
  [10252, 10254], [10258, 10260], [10269, 10270], [10279, 10288], [10295, 10313],
  [10405, 10408], [10411, 10416], [10423, 10424], [10528, 10530], [10558, 10559],
  [12702, 12710], [12712, 12718], [20035, 20039], [20046, 20049], [20265, 20271],
  [20273, 20277], [20591, 20605], [20670, 20675], [20679, 20682], [20685, 20689],
  [20975, 20976], [21139, 21140], [21150, 21157], [21159, 21182], [21369, 21370],
  [21435, 21441], [21517, 21526], [21584, 21589], [21601, 21606], [22348, 22349],
  [22434, 22454], [22787, 22789], [22850, 22864], [22929, 22937], [22945, 22947],
  [22949, 22954], [22962, 22964], [22978, 22987], [23075, 23082], [23084, 23085],
  [23705, 23724], [23896, 23905], [23933, 23934], [23936, 23937], [23964, 23970],
  [23974, 23977], [23979, 23980], [25155, 25156], [26200, 26203], [26212, 26214],
  [26219, 26230], [26245, 26253], [26264, 26274], [26285, 26291], [26297, 26298],
  [26300, 26305], [26458, 26472], [26573, 26592], [28731, 28734], [28737, 28739],
  [28753, 28756], [28761, 28762], [28781, 28782], [28792, 28795], [28797, 28801],
  [28806, 28811], [28836, 28839], [28841, 28845], [28907, 28909], [28911, 28913],
  [28916, 28920], [28939, 28947], [29784, 29785], [29913, 29914], [35347, 35348],
  [69831, 69832],
];

export function isQuarantinedSourceId(sourceId: string | number | null | undefined): boolean {
  if (sourceId == null || sourceId === '') return false;
  const n = typeof sourceId === 'number' ? sourceId : Number(String(sourceId).trim());
  if (!Number.isFinite(n) || !Number.isInteger(n)) return false;
  if (QUARANTINED_SINGLETONS.has(n)) return true;
  if (QA_QUARANTINE.has(n)) return true;
  if (BADSTATS_20261017_SINGLETONS.has(n)) return true;
  if (BADSTATS_20261017_RANGES.some(([lo, hi]) => n >= lo && n <= hi)) return true;
  return QUARANTINE_RANGES.some(([lo, hi]) => n >= lo && n <= hi);
}

export const CONTENT_QUARANTINE_REASON =
  'This edition is temporarily unavailable while we verify the source text.';
