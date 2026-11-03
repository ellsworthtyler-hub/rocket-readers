import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isQuarantinedSourceId } from '@/lib/contentQuarantine';

// Live QA quarantine (rr_book_qa.quarantined via rr_quarantined_source_ids view).
// Lets new auto-quarantines take effect on book/reader/packet routes without a deploy;
// listings/search/sitemap use the committed snapshot in data/qa_quarantine_source_ids.json.
const TTL_MS = 10 * 60 * 1000;
let cache: { ids: Set<string>; at: number } | null = null;

async function liveIds(): Promise<Set<string>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.ids;
  const ids = new Set<string>();
  try {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabaseAdmin
        .from('rr_quarantined_source_ids')
        .select('source_id')
        .range(from, from + 999);
      if (error || !data) break;
      for (const r of data) if (r.source_id) ids.add(String(r.source_id));
      if (data.length < 1000) break;
    }
  } catch {
    // fall back to static list only
  }
  cache = { ids, at: Date.now() };
  return ids;
}

export async function isQuarantinedServer(sourceId: string | number | null | undefined): Promise<boolean> {
  if (isQuarantinedSourceId(sourceId)) return true;
  if (sourceId == null || sourceId === '') return false;
  return (await liveIds()).has(String(sourceId).trim());
}
