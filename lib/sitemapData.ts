// Data helpers for the split book sitemaps (Phase 4).
// Read-only queries with the anon client; keyset-paginated so each request stays on the primary key.
import { isQuarantinedSourceId } from './contentQuarantine';
import { supabase } from './supabaseClient';

/** rr_book.id width covered by one sitemap file. Ids are sparse, so a file holds well under 50,000 URLs. */
export const BOOK_ID_SPAN = 50_000;
const PAGE = 1000;

export type SitemapBook = { sourceId: string; lastModified: string | null };

/** Highest Gutenberg rr_book_metadata.book_id that has processed stats (0 on error). */
export async function maxProcessedBookId(): Promise<number> {
  const { data, error } = await supabase
    .from('rr_book_metadata')
    .select('book_id, rr_book!inner(source)')
    .not('last_processed', 'is', null)
    .eq('rr_book.source', 'gutenberg')
    .order('book_id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('maxProcessedBookId:', error.message);
    return 0;
  }
  return Number(data?.book_id) || 0;
}

/** Number of book sitemap files needed (at least 1). */
export async function bookSitemapCount(): Promise<number> {
  const maxId = await maxProcessedBookId();
  // Fall back to 3 files (covers ids up to 150k today) if the lookup failed.
  return maxId > 0 ? Math.floor(maxId / BOOK_ID_SPAN) + 1 : 3;
}

/**
 * Indexable Gutenberg books whose internal id is in [index*SPAN, (index+1)*SPAN).
 * Same set the /book/[id] page serves: source=gutenberg, processed stats, not quarantined.
 */
export async function booksForSitemap(index: number): Promise<SitemapBook[]> {
  const lo = index * BOOK_ID_SPAN;
  const hi = lo + BOOK_ID_SPAN;
  const out: SitemapBook[] = [];
  let after = lo - 1;

  for (;;) {
    const { data, error } = await supabase
      .from('rr_book_metadata')
      .select('book_id, last_processed, rr_book!inner(source_id, source)')
      .not('last_processed', 'is', null)
      .eq('rr_book.source', 'gutenberg')
      .gt('book_id', after)
      .lt('book_id', hi)
      .order('book_id', { ascending: true })
      .limit(PAGE);
    if (error) {
      console.error('booksForSitemap:', error.message);
      break;
    }
    const rows = data || [];
    for (const row of rows) {
      const rr = Array.isArray(row.rr_book) ? row.rr_book[0] : row.rr_book;
      const sourceId = rr?.source_id != null ? String(rr.source_id) : '';
      if (!/^\d{1,10}$/.test(sourceId) || isQuarantinedSourceId(sourceId)) continue;
      out.push({ sourceId, lastModified: row.last_processed ?? null });
    }
    if (rows.length < PAGE) break;
    after = Number(rows[rows.length - 1].book_id);
  }
  return out;
}
