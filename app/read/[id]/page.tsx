//  FILE: app/read/[id]/page.tsx
//  URL param = public Gutenberg source_id
//  Layout gives the interactive ebook iframe near full viewport height.

import { supabase } from '@/lib/supabaseClient';
import RocketReader from '@/components/ui/Rocketreader';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; sample?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  const sourceId = resolvedParams.id;
  const currentPage = parseInt(resolvedSearch.page || '1', 10);
  const forceSample =
    resolvedSearch.sample === 'true' ||
    resolvedSearch.sample === '1' ||
    resolvedSearch.sample === '';

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

  const { data: metaData } = await supabase
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

  const isProcessed = !!(metaData?.last_processed && metaData?.has_analysis_file);

  const title = rrBook.title || 'Rocket Reader';
  const author = rrBook.author || 'Unknown Author';

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Compact chrome so the published toolbar has room */}
      <div className="bg-white border-b px-4 py-2.5 sticky top-0 z-40 shadow-sm shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link
            href={`/book/${sourceId}`}
            className="text-slate-500 hover:text-emerald-600 font-semibold transition flex items-center gap-1.5 text-sm shrink-0"
          >
            <span className="text-lg leading-none">←</span> Stats
          </Link>

          <div className="text-sm md:text-base font-bold text-slate-800 text-center truncate min-w-0">
            {title}
          </div>

          <div className="w-[52px] shrink-0 hidden sm:block" aria-hidden />
        </div>
      </div>

      <div className="flex-grow w-full max-w-6xl mx-auto px-2 sm:px-4 py-3">
        <RocketReader
          sourceId={sourceId}
          internalBookId={internalBookId}
          title={title}
          author={author}
          metadata={metaData || null}
          isProcessed={isProcessed}
          currentPage={currentPage}
          forceSample={forceSample}
        />
      </div>
    </main>
  );
}
