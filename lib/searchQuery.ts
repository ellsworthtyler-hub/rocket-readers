// Shared library-search query, used by the server-rendered first page of /search
// and by the client when filters change. Read-only (anon key).
import { isQuarantinedSourceId } from './contentQuarantine';
import { supabase } from './supabaseClient';
import { RR_PARENT_THEMES, resolveThemeFilter } from './themes';

export interface SearchBook {
  id: string;
  title: string;
  author: string;
  dolch: string;
  fry: string;
  fleschGrade: string;
  dialogRatio: string;
}

export type SearchFilters = {
  activeSearch: string;
  theme: string;
  minDolch: string;
  minFry: string;
  minFlesch: string;
  minDialog: string;
  variability: string;
  sentenceTier: string;
  wordTier: string;
  wordLength: string;
  sortBy: string;
  currentPage: number;
};

export const SEARCH_PAGE_SIZE = 100;

export function defaultSearchFilters(theme = ''): SearchFilters {
  return {
    activeSearch: '',
    theme,
    minDolch: '0',
    minFry: '0',
    minFlesch: '0',
    minDialog: '0',
    variability: '0',
    sentenceTier: '0',
    wordTier: '0',
    wordLength: '0',
    sortBy: 'dolch_percentage',
    currentPage: 1,
  };
}

const LIST_SELECT = `
  book_id,
  dolch_percentage,
  fry_percentage,
  dialog_percentage,
  flesch_grade,
  flesch_reading_ease,
  total_words,
  total_sentences,
  word_variability_ratio,
  avg_word_length,
  last_processed,
  rr_book!inner (
    source_id,
    title,
    author,
    theme
  )
`;

export async function fetchLibraryStats() {
  const { data } = await supabase.from('library_percentiles').select('*').maybeSingle();
  return data ?? null;
}

/** Parent themes that have at least one processed book, largest first. */
export async function fetchThemeOptions(): Promise<{ theme: string; count: number }[]> {
  const results = await Promise.all(
    RR_PARENT_THEMES.map(async (t): Promise<{ theme: string; count: number } | null> => {
      const { count, error } = await supabase
        .from('rr_book_metadata')
        .select('book_id, rr_book!inner(theme)', { count: 'exact', head: true })
        .not('last_processed', 'is', null)
        .eq('rr_book.theme', t);
      if (error) {
        console.warn('theme count failed for', t, error.message);
        return null;
      }
      return { theme: t, count: count || 0 };
    })
  );
  return results
    .filter((r): r is { theme: string; count: number } => !!r && r.count > 0)
    .sort((a, b) => b.count - a.count);
}

export async function fetchSearchPage(
  f: SearchFilters
): Promise<{ books: SearchBook[]; total: number } | null> {
  let query = supabase
    .from('rr_book_metadata')
    .select(LIST_SELECT, { count: 'exact' })
    .not('last_processed', 'is', null);

  if (f.minDolch !== '0') query = query.gte('dolch_percentage', parseFloat(f.minDolch));
  if (f.minFry !== '0') query = query.gte('fry_percentage', parseFloat(f.minFry));
  // Flesch Ease filter (higher = easier)
  if (f.minFlesch !== '0') query = query.gte('flesch_reading_ease', parseFloat(f.minFlesch));
  if (f.minDialog !== '0') query = query.gte('dialog_percentage', parseFloat(f.minDialog));
  if (f.variability !== '0') query = query.gte('word_variability_ratio', parseFloat(f.variability));
  if (f.wordLength !== '0') query = query.gte('avg_word_length', parseFloat(f.wordLength));

  if (f.sentenceTier !== '0') {
    if (f.sentenceTier === 'over_5000') query = query.gte('total_sentences', 5000);
    else query = query.lte('total_sentences', parseInt(f.sentenceTier, 10));
  }

  if (f.wordTier !== '0') {
    if (f.wordTier === 'over_30000') query = query.gte('total_words', 30000);
    else query = query.lte('total_words', parseInt(f.wordTier, 10));
  }

  // Exact match on rr_book.theme parent group (e.g. "Science & Technology")
  const resolvedTheme = resolveThemeFilter(f.theme);
  if (resolvedTheme !== '') query = query.eq('rr_book.theme', resolvedTheme);
  if (f.activeSearch !== '') query = query.ilike('rr_book.title', `%${f.activeSearch}%`);

  if (f.sortBy === 'flesch_grade' || f.sortBy === 'flesch_reading_ease') {
    query = query.order('flesch_grade', { ascending: true, nullsFirst: false });
  } else {
    query = query.order(f.sortBy, { ascending: false, nullsFirst: false });
  }

  const startIndex = (f.currentPage - 1) * SEARCH_PAGE_SIZE;
  query = query.range(startIndex, startIndex + SEARCH_PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error('Supabase fetch error:', error);
    return null;
  }

  type Row = {
    book_id: number;
    dolch_percentage: number | null;
    fry_percentage: number | null;
    flesch_grade: number | null;
    dialog_percentage: number | null;
    rr_book: { source_id: string | null; title: string | null; author: string | null } | { source_id: string | null; title: string | null; author: string | null }[] | null;
  };
  const rows = (data || []) as unknown as Row[];
  const books: SearchBook[] = rows
    .map((b) => {
      const rr = Array.isArray(b.rr_book) ? b.rr_book[0] : b.rr_book;
      return {
        id: String(rr?.source_id ?? b.book_id),
        title: rr?.title || `Book ${b.book_id}`,
        author: rr?.author || 'Unknown Author',
        dolch: b.dolch_percentage?.toString() || '0',
        fry: b.fry_percentage?.toString() || '0',
        fleschGrade: b.flesch_grade?.toString() || '0',
        dialogRatio: b.dialog_percentage?.toString() || '0',
      };
    })
    .filter((bk) => !isQuarantinedSourceId(bk.id));

  return { books, total: Math.max(0, (count || 0) - (rows.length - books.length)) };
}
