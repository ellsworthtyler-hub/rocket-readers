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
 */

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

export function isQuarantinedSourceId(sourceId: string | number | null | undefined): boolean {
  if (sourceId == null || sourceId === '') return false;
  const n = typeof sourceId === 'number' ? sourceId : Number(String(sourceId).trim());
  if (!Number.isFinite(n) || !Number.isInteger(n)) return false;
  if (QUARANTINED_SINGLETONS.has(n)) return true;
  return QUARANTINE_RANGES.some(([lo, hi]) => n >= lo && n <= hi);
}

export const CONTENT_QUARANTINE_REASON =
  'This edition is temporarily unavailable while we verify the source text.';
