//  FILE: app/page.tsx
//  ========================

import Link from 'next/link';
import { BookCard } from '../components/BookCard';
import { loadBooks, getGlobalStats } from '@/lib/data';
import { BadgeLegend } from "@/components/BadgeLegend";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Use the centralized new-schema helpers (rr_book_metadata + rr_book)
  const allBooks = await loadBooks(20);

  // For the "Hot off the Launchpad" section, show the strongest Dolch books first
  const hotBooks = [...allBooks]
    .sort((a, b) => parseFloat(b.dolch) - parseFloat(a.dolch))
    .slice(0, 6);

  const stats = await getGlobalStats();
  const totalBooks = stats.totalBooks;
  const avgDolch = stats.avgDolch;
  const avgFry = stats.avgFry;

  // --- Dynamic percentiles for badges (still from legacy table for now; BookCard has fallbacks) ---
  // We intentionally keep this query separate so the home page doesn't break if library_percentiles is empty.
  let libraryStats: any = null;
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    const { data } = await supabase
      .from('library_percentiles')
      .select('*')
      .single();
    libraryStats = data;
  } catch (e) {
    // Silent — BookCard already handles missing libraryStats with static badge logic
  }
  // -------------------------------------------------------------------------------------------

  return (
    <div className="min-h-screen">
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-3" aria-hidden>🚀📚✨</div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-amber-200 via-emerald-300 to-sky-300 bg-clip-text text-transparent">
            Rocket Readers
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed font-semibold">
            Find books with the highest sight-word coverage for your readers.
          </p>
          <Link
            href="/search"
            className="inline-block bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-[0_7px_0_#065f46] hover:translate-y-0.5 hover:shadow-[0_4px_0_#065f46] transition-all"
          >
            Browse the Full Library →
          </Link>
          <div className="max-w-3xl mx-auto mt-10 text-left rounded-3xl border-[3px] border-indigo-400 bg-slate-900/80 px-6 py-6 text-slate-200 leading-relaxed shadow-[0_0_0_6px_rgba(129,140,248,0.12)]">
            <p className="mb-4">
              Rocket Readers turns classic public-domain books into powerful literacy tools by analyzing every text for the exact building blocks young readers and English learners need most. Our engine measures Dolch and Fry sight-word coverage, dialogue ratio, word-length patterns, readability scores, and part-of-speech balance—then delivers clear progress reports plus ready-to-use classroom packets packed with vocabulary sheets, flashcards, memory games, spelling and sentence scramblers, word searches, and more—all drawn directly from the book itself.
            </p>
            <p>
              Parents and teachers finally get transparent data on how “sight-word dense” a story really is, plus engaging, book-specific practice that builds automatic recognition, fluency, and confidence. Whether you are supporting a beginning reader, an ESL student, or a whole classroom, Rocket Readers makes high-quality, research-aligned materials free and instantly usable so every child can experience the joy of successful reading.{" "}
              <Link href="/about" className="text-amber-200 font-extrabold hover:underline">Learn more about our approach →</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">🔥 Hot off the Launchpad</h2>
          <Link href="/search" className="text-emerald-300 font-bold hover:underline">
            See all books →
          </Link>
        </div>
        
        {/* NEW: Drop the Legend right above the grid */}
        <BadgeLegend />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotBooks.map((book) => (
            <BookCard 
              key={book.id} 
              {...book} 
              libraryStats={libraryStats} // NEW: Pass the stats down!
            />
          ))}
        </div>
      </div>

      {/* Global Stats Banner */}
      <div className="max-w-5xl mx-auto px-6 mt-12">
        <div className="rounded-3xl border-4 border-amber-200 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 py-12 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">
                {(totalBooks || 0).toLocaleString()}
              </div>
              <div className="font-semibold">Books Analyzed</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">{avgDolch}%</div>
              <div className="font-semibold">Average Dolch Density</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">{avgFry}%</div>
              <div className="font-semibold">Average Fry Density</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Teaser */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">Ready to accelerate reading comprehension?</h3>
        <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">
          Teachers, homeschoolers, and ESL instructors love Rocket Readers because it shows exactly which books will help their students succeed.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/search"
            className="inline-flex items-center gap-3 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_7px_0_#312e81] hover:translate-y-0.5 transition"
          >
            Explore the Archive
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-3 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_7px_0_#065f46] hover:translate-y-0.5 transition"
          >
            About Us
          </Link>
        </div>
      </div>
      
    </div>
  );
}