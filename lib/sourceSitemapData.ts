// Data for the non-Gutenberg sitemap series: /book/sources/sitemap/{n}.xml
// Server-only (service role, because rr_book_qa is RLS-protected). Lists exactly the set the
// /book/[ref] page serves: enabled source, passed QA 4b-4d, not quarantined, processed stats.
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { enabledExtraSources, type BookSource } from '@/lib/bookSources';
import { qaRowServable, type QaRow } from '@/lib/bookEligibility';

export const SOURCE_SITEMAP_SIZE = 40_000;
const PAGE = 1000;

export type SourceSitemapBook = { source: BookSource; sourceId: string; lastModified: string | null };

function baseQuery(head = false) {
  const sources = enabledExtraSources();
  return supabaseAdmin
    .from('rr_book_qa')
    .select(
      'book_id, s4b_status, s4c_status, s4d_status, rights_status, quarantined, rr_book!inner(source, source_id, rr_book_metadata!inner(last_processed))',
      head ? { count: 'exact', head: true } : undefined
    )
    .in('rr_book.source', sources.length ? sources : ['__none__'])
    .eq('s4b_status', 'pass')
    .eq('s4c_status', 'pass')
    .eq('s4d_status', 'pass')
    .eq('quarantined', false)
    .not('rr_book.rr_book_metadata.last_processed', 'is', null);
}

/** Number of source sitemap files (0 when no extra source is enabled). */
export async function sourceSitemapCount(): Promise<number> {
  if (!enabledExtraSources().length) return 0;
  const { count, error } = await baseQuery(true);
  if (error) {
    console.error('sourceSitemapCount:', error.message);
    return 0;
  }
  return Math.ceil((count || 0) / SOURCE_SITEMAP_SIZE);
}

type Row = QaRow & {
  book_id: number;
  rr_book:
    | { source: string; source_id: string; rr_book_metadata: { last_processed: string | null } | { last_processed: string | null }[] | null }
    | null;
};

export async function sourceBooksForSitemap(index: number): Promise<SourceSitemapBook[]> {
  if (!enabledExtraSources().length) return [];
  const out: SourceSitemapBook[] = [];
  const start = index * SOURCE_SITEMAP_SIZE;
  for (let from = start; from < start + SOURCE_SITEMAP_SIZE; from += PAGE) {
    const { data, error } = await baseQuery().order('book_id', { ascending: true }).range(from, from + PAGE - 1);
    if (error) {
      console.error('sourceBooksForSitemap:', error.message);
      break;
    }
    const rows = (data || []) as unknown as Row[];
    for (const r of rows) {
      const b = r.rr_book;
      if (!b) continue;
      const source = b.source as BookSource;
      if (!qaRowServable(source, r)) continue;
      const m = Array.isArray(b.rr_book_metadata) ? b.rr_book_metadata[0] : b.rr_book_metadata;
      out.push({ source, sourceId: String(b.source_id), lastModified: m?.last_processed ?? null });
    }
    if (rows.length < PAGE) break;
  }
  return out;
}
