import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isQuarantinedSourceId, quarantineKey } from '@/lib/contentQuarantine';

// Live QA quarantine (rr_book_qa.quarantined), keyed on source + source_id so a
// quarantined Wikisource/Wikibooks/PGA book never blocks the Gutenberg book that
// shares its numeric id (and vice versa).
// Primary view: rr_quarantined_book_refs (all sources; sql/2026-11-03_gutenberg_only_views.sql).
// Fallback: legacy rr_quarantined_source_ids (Gutenberg-only) until that migration is applied.
// Listings/search/sitemap use the committed snapshot in data/qa_quarantine_source_ids.json.
const TTL_MS = 10 * 60 * 1000;
let cache: { keys: Set<string>; at: number } | null = null;

type Row = { source?: string | null; source_id: string | null };

async function fetchAll(view: string, cols: string): Promise<Row[] | null> {
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin.from(view).select(cols).range(from, from + 999);
    if (error || !data) return from === 0 ? null : out;
    out.push(...(data as unknown as Row[]));
    if (data.length < 1000) return out;
  }
}

async function liveKeys(): Promise<Set<string>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.keys;
  const keys = new Set<string>();
  try {
    let rows = await fetchAll('rr_quarantined_book_refs', 'source, source_id');
    if (!rows) {
      rows = (await fetchAll('rr_quarantined_source_ids', 'source_id'))?.map((r) => ({ ...r, source: 'gutenberg' })) ?? [];
    }
    for (const r of rows) if (r.source_id) keys.add(quarantineKey(r.source || 'gutenberg', r.source_id));
  } catch {
    // fall back to static list only
  }
  cache = { keys, at: Date.now() };
  return keys;
}

export async function isQuarantinedServer(
  sourceId: string | number | null | undefined,
  source: string = 'gutenberg'
): Promise<boolean> {
  if (isQuarantinedSourceId(sourceId, source)) return true;
  if (sourceId == null || sourceId === '') return false;
  return (await liveKeys()).has(quarantineKey(source, sourceId));
}
