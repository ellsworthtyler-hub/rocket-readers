//  FILE: lib/data.ts
//  Single source of truth for library queries against rr_book + rr_book_metadata
import { supabase } from './supabaseClient';

export interface BookCardData {
  id: string; // public Gutenberg source_id
  title: string;
  author: string;
  theme?: string;
  dolch: string;
  fry: string;
  dialogRatio: string;
  fleschGrade: string; // Flesch–Kincaid grade (lower = easier)
  fleschEase?: string;
}

export interface BookDetailMeta {
  sourceId: string;
  internalBookId: number;
  title: string;
  author: string;
  theme: string;
  total_words: number | null;
  total_sentences: number | null;
  unique_words: number | null;
  avg_sentence_length: number | null;
  avg_word_length: number | null;
  word_variability_ratio: number | null;
  dolch_percentage: number | null;
  fry_percentage: number | null;
  dialog_percentage: number | null;
  flesch_reading_ease: number | null;
  flesch_grade: number | null;
  dolch_prek_breadth: number | null;
  dolch_kinder_breadth: number | null;
  dolch_1st_breadth: number | null;
  dolch_2nd_breadth: number | null;
  dolch_3rd_breadth: number | null;
  dolch_prek_unique: number | null;
  dolch_kinder_unique: number | null;
  dolch_1st_unique: number | null;
  dolch_2nd_unique: number | null;
  dolch_3rd_unique: number | null;
  fry_total_breadth: number | null;
  fry_total_unique: number | null;
  count_nouns: number | null;
  count_verbs: number | null;
  count_adjectives: number | null;
  count_adverbs: number | null;
  count_prepositions: number | null;
  len_3: number | null;
  len_4: number | null;
  len_5: number | null;
  len_6: number | null;
  len_7: number | null;
  len_8: number | null;
  len_9: number | null;
  len_10: number | null;
  len_11: number | null;
  len_12: number | null;
  len_13: number | null;
  len_14: number | null;
  len_15_plus: number | null;
  last_processed: string | null;
  has_analysis_file: boolean | null;
}

const META_COLS = `
  book_id,
  total_words,
  total_sentences,
  unique_words,
  avg_sentence_length,
  avg_word_length,
  word_variability_ratio,
  dolch_percentage,
  fry_percentage,
  dialog_percentage,
  flesch_reading_ease,
  flesch_grade,
  dolch_prek_breadth,
  dolch_kinder_breadth,
  dolch_1st_breadth,
  dolch_2nd_breadth,
  dolch_3rd_breadth,
  dolch_prek_unique,
  dolch_kinder_unique,
  dolch_1st_unique,
  dolch_2nd_unique,
  dolch_3rd_unique,
  fry_total_breadth,
  fry_total_unique,
  count_nouns,
  count_verbs,
  count_adjectives,
  count_adverbs,
  count_prepositions,
  len_3, len_4, len_5, len_6, len_7, len_8, len_9,
  len_10, len_11, len_12, len_13, len_14, len_15_plus,
  has_analysis_file,
  last_processed
`;

const LIST_SELECT = `
  ${META_COLS},
  rr_book!inner (
    id,
    source_id,
    title,
    author,
    theme
  )
`;

function unwrapBook(row: any) {
  const rr = Array.isArray(row.rr_book) ? row.rr_book[0] : row.rr_book;
  return rr || null;
}

function pickMetaFields(m: any) {
  return {
    total_words: m?.total_words ?? null,
    total_sentences: m?.total_sentences ?? null,
    unique_words: m?.unique_words ?? null,
    avg_sentence_length: m?.avg_sentence_length ?? null,
    avg_word_length: m?.avg_word_length ?? null,
    word_variability_ratio: m?.word_variability_ratio ?? null,
    dolch_percentage: m?.dolch_percentage ?? null,
    fry_percentage: m?.fry_percentage ?? null,
    dialog_percentage: m?.dialog_percentage ?? null,
    flesch_reading_ease: m?.flesch_reading_ease ?? null,
    flesch_grade: m?.flesch_grade ?? null,
    dolch_prek_breadth: m?.dolch_prek_breadth ?? null,
    dolch_kinder_breadth: m?.dolch_kinder_breadth ?? null,
    dolch_1st_breadth: m?.dolch_1st_breadth ?? null,
    dolch_2nd_breadth: m?.dolch_2nd_breadth ?? null,
    dolch_3rd_breadth: m?.dolch_3rd_breadth ?? null,
    dolch_prek_unique: m?.dolch_prek_unique ?? null,
    dolch_kinder_unique: m?.dolch_kinder_unique ?? null,
    dolch_1st_unique: m?.dolch_1st_unique ?? null,
    dolch_2nd_unique: m?.dolch_2nd_unique ?? null,
    dolch_3rd_unique: m?.dolch_3rd_unique ?? null,
    fry_total_breadth: m?.fry_total_breadth ?? null,
    fry_total_unique: m?.fry_total_unique ?? null,
    count_nouns: m?.count_nouns ?? null,
    count_verbs: m?.count_verbs ?? null,
    count_adjectives: m?.count_adjectives ?? null,
    count_adverbs: m?.count_adverbs ?? null,
    count_prepositions: m?.count_prepositions ?? null,
    len_3: m?.len_3 ?? null,
    len_4: m?.len_4 ?? null,
    len_5: m?.len_5 ?? null,
    len_6: m?.len_6 ?? null,
    len_7: m?.len_7 ?? null,
    len_8: m?.len_8 ?? null,
    len_9: m?.len_9 ?? null,
    len_10: m?.len_10 ?? null,
    len_11: m?.len_11 ?? null,
    len_12: m?.len_12 ?? null,
    len_13: m?.len_13 ?? null,
    len_14: m?.len_14 ?? null,
    len_15_plus: m?.len_15_plus ?? null,
    last_processed: m?.last_processed ?? null,
    has_analysis_file: m?.has_analysis_file ?? null,
  };
}

export function mapBookCard(row: any): BookCardData {
  const rr = unwrapBook(row);
  const sourceId = rr?.source_id != null ? String(rr.source_id) : String(row.book_id);
  return {
    id: sourceId,
    title: rr?.title || 'Unknown Title',
    author: rr?.author || 'Unknown Author',
    theme: rr?.theme || 'Uncategorized',
    dolch: (row.dolch_percentage ?? 0).toString(),
    fry: (row.fry_percentage ?? 0).toString(),
    dialogRatio: (row.dialog_percentage ?? 0).toString(),
    fleschGrade: (row.flesch_grade ?? 0).toString(),
    fleschEase: (row.flesch_reading_ease ?? 0).toString(),
  };
}

export async function resolveRrBookBySourceId(sourceId: string) {
  const { data, error } = await supabase
    .from('rr_book')
    .select('id, source_id, title, author, theme, subjects')
    .eq('source_id', sourceId)
    .eq('source', 'gutenberg')
    .maybeSingle();

  if (error) {
    console.error('resolveRrBookBySourceId:', error);
    return null;
  }
  return data;
}

export async function getBookMetadataForSourceId(
  sourceId: string
): Promise<BookDetailMeta | null> {
  const book = await resolveRrBookBySourceId(sourceId);
  if (!book) return null;

  const { data: meta, error: metaErr } = await supabase
    .from('rr_book_metadata')
    .select(META_COLS)
    .eq('book_id', book.id)
    .maybeSingle();

  if (metaErr) {
    console.error('getBookMetadataForSourceId:', metaErr);
  }

  return {
    sourceId: String(book.source_id),
    internalBookId: book.id,
    title: book.title || 'Unknown Title',
    author: book.author || 'Unknown Author',
    theme: book.theme || 'Uncategorized',
    ...pickMetaFields(meta || {}),
  };
}

export interface ListBooksParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  theme?: string;
  search?: string;
  minDolch?: number;
  minFry?: number;
  minDialog?: number;
  minFleschEase?: number;
  minVariability?: number;
  minWordLength?: number;
  maxSentences?: number | null;
  minSentences?: number | null;
  maxWords?: number | null;
  minWords?: number | null;
}

export async function listProcessedBooks(opts: ListBooksParams = {}) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 100;
  const start = (page - 1) * pageSize;

  let query = supabase
    .from('rr_book_metadata')
    .select(LIST_SELECT, { count: 'exact' })
    .not('last_processed', 'is', null);

  if (opts.minDolch && opts.minDolch > 0) {
    query = query.gte('dolch_percentage', opts.minDolch);
  }
  if (opts.minFry && opts.minFry > 0) {
    query = query.gte('fry_percentage', opts.minFry);
  }
  if (opts.minDialog && opts.minDialog > 0) {
    query = query.gte('dialog_percentage', opts.minDialog);
  }
  if (opts.minFleschEase && opts.minFleschEase > 0) {
    query = query.gte('flesch_reading_ease', opts.minFleschEase);
  }
  if (opts.minVariability && opts.minVariability > 0) {
    query = query.gte('word_variability_ratio', opts.minVariability);
  }
  if (opts.minWordLength && opts.minWordLength > 0) {
    query = query.gte('avg_word_length', opts.minWordLength);
  }
  if (opts.maxSentences != null) {
    query = query.lte('total_sentences', opts.maxSentences);
  }
  if (opts.minSentences != null) {
    query = query.gte('total_sentences', opts.minSentences);
  }
  if (opts.maxWords != null) {
    query = query.lte('total_words', opts.maxWords);
  }
  if (opts.minWords != null) {
    query = query.gte('total_words', opts.minWords);
  }

  if (opts.theme) {
    query = query.ilike('rr_book.theme', `%${opts.theme}%`);
  }
  if (opts.search) {
    query = query.ilike('rr_book.title', `%${opts.search}%`);
  }

  const sortBy = opts.sortBy || 'dolch_percentage';
  if (sortBy === 'flesch_grade' || sortBy === 'flesch_reading_ease') {
    // "Easiest" = lowest Flesch–Kincaid grade
    query = query.order('flesch_grade', { ascending: true, nullsFirst: false });
  } else {
    query = query.order(sortBy, { ascending: false, nullsFirst: false });
  }

  query = query.range(start, start + pageSize - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error('listProcessedBooks:', error);
    return { books: [] as BookCardData[], total: 0, error };
  }

  return {
    books: (data || []).map(mapBookCard),
    total: count || 0,
    error: null,
  };
}

export async function loadBooks(limit = 100): Promise<BookCardData[]> {
  const { books } = await listProcessedBooks({ page: 1, pageSize: limit });
  return books;
}

export async function getGlobalStats() {
  const { data, count, error } = await supabase
    .from('rr_book_metadata')
    .select('dolch_percentage, fry_percentage', { count: 'exact' })
    .not('last_processed', 'is', null)
    .limit(5000);

  if (error || !data || data.length === 0) {
    return { totalBooks: 0, avgDolch: '0', avgFry: '0' };
  }

  const totalDolch = data.reduce((sum, book) => sum + (book.dolch_percentage || 0), 0);
  const totalFry = data.reduce((sum, book) => sum + (book.fry_percentage || 0), 0);

  return {
    totalBooks: count || data.length,
    avgDolch: (totalDolch / data.length).toFixed(1),
    avgFry: (totalFry / data.length).toFixed(1),
  };
}

/** Percentile thresholds for badges (view first, else compute). */
export async function getLibraryPercentiles() {
  const { data: viewData, error: viewErr } = await supabase
    .from('library_percentiles')
    .select('*')
    .maybeSingle();

  if (!viewErr && viewData && (viewData as any).dolch_top_10 != null) {
    return viewData;
  }

  const { data, error } = await supabase
    .from('rr_book_metadata')
    .select('dolch_percentage, fry_percentage, dialog_percentage, flesch_grade, flesch_reading_ease')
    .not('last_processed', 'is', null)
    .limit(5000);

  if (error || !data?.length) {
    return null;
  }

  const pct = (arr: number[], p: number) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
    return sorted[idx];
  };

  const dolch = data.map((d) => Number(d.dolch_percentage) || 0);
  const fry = data.map((d) => Number(d.fry_percentage) || 0);
  const dialog = data.map((d) => Number(d.dialog_percentage) || 0);
  const flesch = data.map((d) => Number(d.flesch_grade) || 0);

  return {
    dolch_top_5: pct(dolch, 0.95),
    dolch_top_10: pct(dolch, 0.9),
    dolch_top_25: pct(dolch, 0.75),
    dolch_top_50: pct(dolch, 0.5),
    dolch_top_75: pct(dolch, 0.25),
    fry_top_5: pct(fry, 0.95),
    fry_top_10: pct(fry, 0.9),
    fry_top_25: pct(fry, 0.75),
    fry_top_50: pct(fry, 0.5),
    fry_top_75: pct(fry, 0.25),
    dialog_top_5: pct(dialog, 0.95),
    dialog_top_10: pct(dialog, 0.9),
    dialog_top_25: pct(dialog, 0.75),
    dialog_top_50: pct(dialog, 0.5),
    dialog_top_75: pct(dialog, 0.25),
    // Grade: lower is better — top 10% easiest ≈ 10th percentile of grade values
    flesch_top_90: pct(flesch, 0.1),
    flesch_top_75: pct(flesch, 0.25),
    flesch_top_50: pct(flesch, 0.5),
    flesch_top_25: pct(flesch, 0.75),
  };
}

export async function getAllMetricSamples() {
  const { data } = await supabase
    .from('rr_book_metadata')
    .select('dolch_percentage, fry_percentage, dialog_percentage, flesch_reading_ease, flesch_grade')
    .not('last_processed', 'is', null)
    .limit(5000);
  return data || [];
}
