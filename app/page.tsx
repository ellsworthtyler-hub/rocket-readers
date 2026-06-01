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
    <div className="min-h-screen bg-slate-50">
      
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Rocket Reader
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Find books with the highest sight-word coverage for your readers.
          </p>
          <Link 
            href="/search" 
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-sm transition-all"
          >
            Browse the Full Library →
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Hot off the Launchpad</h2>
          <Link href="/search" className="text-emerald-600 font-bold hover:underline">
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
      <div className="bg-emerald-50 border-y border-emerald-100 py-16 mt-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-5xl font-bold text-emerald-600 mb-2">
              {(totalBooks || 0).toLocaleString()}
            </div>
            <div className="text-slate-600 font-medium">Books Analyzed</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-emerald-600 mb-2">{avgDolch}%</div>
            <div className="text-slate-600 font-medium">Average Dolch Density</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-amber-500 mb-2">{avgFry}%</div>
            <div className="text-slate-600 font-medium">Average Fry Density</div>
          </div>
        </div>
      </div>

      {/* Footer Teaser */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h3 className="text-2xl font-bold text-slate-800 mb-4">Ready to accelerate reading comprehension?</h3>
        <p className="text-slate-600 mb-8 max-w-2xl mx-auto text-lg">
          Teachers, homeschoolers, and ESL instructors love Rocket Reader because it shows exactly which books will help their students succeed.
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-3 bg-slate-900 text-white font-bold px-8 py-4 rounded-2xl hover:bg-slate-800 transition shadow-sm"
        >
          Explore the Archive
        </Link>
      </div>
      
    </div>
  );
}