//  FILE: app/read/[id]/page.tsx
//  =============================

import { supabase } from '@/lib/supabaseClient';
import RocketReader from '@/components/ui/Rocketreader'; 
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ReadPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ page?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  
  const bookId = parseInt(resolvedParams.id, 10);
  const currentPage = parseInt(resolvedSearch.page || '1', 10);

  // 1. Fetch Metadata (For the title and reader parameters)
  const { data: metaData, error: metaError } = await supabase
    .from('book_metadata')
    .select('*, gutenberg_catalog(*)')
    .eq('book_id', bookId) 
    .single();

  if (metaError || !metaData) {
    console.error("Database fetch error:", metaError);
    notFound(); 
  }

  // 2. Fetch the Heavy Text Data
  // We only do this here, saving the Stats page from loading this massive payload!
  const { data: sentences } = await supabase
    .from('book_sentences')
    .select('*')
    .eq('book_id', bookId)
    .order('sentence_index', { ascending: true });

  const { data: tokens } = await supabase
    .from('book_tokens')
    .select('*')
    .eq('book_id', bookId)
    .order('token_index', { ascending: true });

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* 3. Minimalist Sticky Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link 
            href={`/book/${bookId}`} 
            className="text-slate-500 hover:text-emerald-600 font-semibold transition flex items-center gap-2"
          >
            <span className="text-lg">←</span> Back to Stats
          </Link>
          
          <div className="text-sm md:text-base font-bold text-slate-800 text-center truncate px-4">
            {metaData.gutenberg_catalog?.title || "Rocket Reader"}
          </div>
          
          {/* Spacer to keep the title perfectly centered */}
          <div className="w-[120px] hidden md:block"></div> 
        </div>
      </div>

      {/* 4. The Reading Canvas */}
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 md:px-6 py-8">
        <RocketReader 
          metadata={metaData} 
          sentences={sentences || []} 
          tokens={tokens || []} 
          bookId={bookId}
          currentPage={currentPage}
        />
      </div>

    </main>
  );
}