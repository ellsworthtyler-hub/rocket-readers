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
 * - singletons 12701, 12711
 * - inclusive range 12719–12724 (RTF-pointer stubs with 2007 copyright line)
 */

const QUARANTINED_SINGLETONS = new Set<number>([12701, 12711]);
const QUARANTINE_RANGES: [number, number][] = [
  [9001, 9042],
  [12719, 12724],
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
