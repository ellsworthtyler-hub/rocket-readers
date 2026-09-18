/**
 * Contaminated enhanced-reader SoT keys (Library Steward / Pipeline).
 * Mislabeled HTML under these Gutenberg source_ids must not reach public
 * library, reader, packet, or teacher-facing surfaces.
 *
 * Bible: never host wrong/copyrighted text; publish EPUB/HTML only with Tyler+QA.
 * Steward signed remaps in progress — expand/shrink this list when they clear keys.
 */

/** Inclusive range 9002–9041 plus singleton 12711. */
const QUARANTINED_SINGLETONS = new Set<number>([12711]);
const QUARANTINE_RANGE: [number, number] = [9002, 9041];

export function isQuarantinedSourceId(sourceId: string | number | null | undefined): boolean {
  if (sourceId == null || sourceId === '') return false;
  const n = typeof sourceId === 'number' ? sourceId : Number(String(sourceId).trim());
  if (!Number.isFinite(n) || !Number.isInteger(n)) return false;
  if (QUARANTINED_SINGLETONS.has(n)) return true;
  const [lo, hi] = QUARANTINE_RANGE;
  return n >= lo && n <= hi;
}

export const CONTENT_QUARANTINE_REASON =
  'This edition is temporarily unavailable while we verify the source text.';
