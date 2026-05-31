//  FILE: app/read/[id]/page.tsx
//  =============================
//  UPDATED (2026-05): Aligned to rr_ schema + R2 publishing model.
//  - URL param is the public Gutenberg source_id (never the internal surrogate).
//  - Resolves source_id → rr_book.id (internal) only for rr_book_metadata join.
//  - No longer queries the deprecated book_sentences / book_tokens tables.
//  - Content now served from published HTML (Supabase Storage bridge → R2 rr-digital-products).
//  - Free users receive the marketing sample; full interactive edition is premium-gated.

import { supabase } from '@/lib/supabaseClient';
import RocketReader from '@/components/ui/Rocketreader';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ReadPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  // IMPORTANT: The URL always uses the public Gutenberg source_id.
  // This matches the convention used by BookCard, BookActions, and all user-facing links.
  const sourceId = resolvedParams.id; // keep as string for exact match against rr_book.source_id
  const currentPage = parseInt(resolvedSearch.page || '1', 10);

  // 1. Resolve public source_id → internal rr_book.id (the duality pattern)
  const { data: rrBook, error: rrBookError } = await supabase
    .from('rr_book')
    .select('id, source_id, title, author')
    .eq('source_id', sourceId)
    .eq('source', 'gutenberg')
    .single();

  if (rrBookError || !rrBook) {
    console.error('rr_book lookup failed for source_id:', sourceId, rrBookError);
    notFound();
  }

  const internalBookId = rrBook.id;

  // 2. Fetch processing status + stats from the new single source of truth for the website
  const { data: metaData, error: metaError } = await supabase
    .from('rr_book_metadata')
    .select(`
      total_words,
      total_sentences,
      unique_words,
      avg_sentence_length,
      avg_word_length,
      dialog_percentage,
      dolch_percentage,
      fry_percentage,
      flesch_reading_ease,
      flesch_grade,
      has_analysis_file,
      last_processed,
      processing_version
    `)
    .eq('book_id', internalBookId)
    .single();

  // We intentionally do NOT notFound() here.
  // Books can exist in rr_book while still being processed or waiting for publisher HTML.
  const isProcessed = !!(metaData?.last_processed && metaData?.has_analysis_file);

  const title = rrBook.title || 'Rocket Reader';
  const author = rrBook.author || 'Unknown Author';

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">

      {/* Minimalist Sticky Header (visual continuity preserved) */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href={`/book/${sourceId}`}
            className="text-slate-500 hover:text-emerald-600 font-semibold transition flex items-center gap-2"
          >
            <span className="text-lg">←</span> Back to Stats
          </Link>

          <div className="text-sm md:text-base font-bold text-slate-800 text-center truncate px-4">
            {title}
          </div>

          <div className="w-[120px] hidden md:block"></div>
        </div>
      </div>

      {/* Reading Canvas */}
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 md:px-6 py-8">
        <RocketReader
          // Public ID used everywhere the user sees it (URLs, sharing, history)
          sourceId={sourceId}
          // Internal surrogate (only for rr_* table joins when truly needed)
          internalBookId={internalBookId}
          title={title}
          author={author}
          metadata={metaData || null}
          isProcessed={isProcessed}
          currentPage={currentPage}
        />
      </div>

    </main>
  );
}