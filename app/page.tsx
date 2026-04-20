//  FILE: app/page.tsx
//  ==========================
import Link from 'next/link';
import { BookCard } from '../components/BookCard';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // 1. Fetch the Top 6 books
  const { data: metadata, error } = await supabase
    .from('book_metadata')
    .select('*, gutenberg_catalog!fk_book_catalog(title, author)')
    .order('dolch_percentage', { ascending: false })
    .limit(6);

  if (error) console.error("❌ Homepage fetch error:", error);

  // 2. Fetch Live Global Stats (Count)
  const { count: totalBooks } = await supabase
    .from('book_metadata')
    .select('*', { count: 'exact', head: true });

  // 3. Fetch Live Global Stats (Averages) via our new SQL function
  const { data: averagesData } = await supabase.rpc('get_book_averages');
  const avgDolch = averagesData?.avg_dolch || 0;
  const avgFry = averagesData?.avg_fry || 0;

  // 4. Map the database results
  const hotBooks = (metadata || []).map((b: any) => {
    const catalog = Array.isArray(b.gutenberg_catalog) 
      ? b.gutenberg_catalog[0] 
      : b.gutenberg_catalog;

    return {
      id: b.book_id.toString(),
      title: catalog?.title || b.title || `Book ${b.book_id}`,
      author: catalog?.author || b.author || "Unknown Author",
      dolch: b.dolch_percentage?.toString() || "0",
      fry: b.fry_percentage?.toString() || "0",
      dialogRatio: b.dialog_percentage?.toString() || "0",
      fleschGrade: b.flesch_reading_ease?.toString() || "0"
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-6xl font-bold mb-6 tracking-tight">Rocket Reader</h1>
          <p className="text-2xl mb-8 max-w-2xl mx-auto">
            Find books with the highest sight-word coverage for your readers
          </p>
          <Link
            href="/search"
            className="inline-block bg-white text-emerald-700 font-semibold px-10 py-4 rounded-3xl text-lg hover:bg-emerald-50 transition"
          >
            Browse the Full Library →
          </Link>
        </div>
      </div>

      {/* Hot off the Launchpad */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-slate-900">Hot off the Launchpad</h2>
            <p className="text-slate-600 mt-2 text-lg">Highest Dolch sight-word density</p>
          </div>
          <Link href="/search" className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2">
            See all books →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotBooks.map((book) => (
            <BookCard
              key={book.id}
              {...book} // Spreads the mapped props into the component
            />
          ))}
        </div>
      </div>

      {/* Live Stats Section */}
      <div className="bg-white border-t border-b py-12 mt-16">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-5xl font-bold text-emerald-600 mb-2">
              {(totalBooks || 0).toLocaleString()}
            </div>
            <div className="text-slate-600">Books Analyzed</div>
          </div>
          <div>
            {/* Replace the hardcoded 72% with the dynamic variable */}
            <div className="text-5xl font-bold text-emerald-600 mb-2">{avgDolch}%</div>
            <div className="text-slate-600">Average Dolch Density</div>
          </div>
          <div>
            {/* Replace the hardcoded 79% with the dynamic variable */}
            <div className="text-5xl font-bold text-amber-600 mb-2">{avgFry}%</div>
            <div className="text-slate-600">Average Fry Density</div>
          </div>
        </div>
      </div>

      {/* Footer Teaser */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <p className="text-slate-600 mb-6">
          Teachers, homeschoolers, and ESL instructors love Rocket Reader because it shows exactly which books will help their students succeed.
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-10 py-4 rounded-3xl transition text-lg"
        >
          Explore the Full Library
        </Link>
      </div>
    </div>
  );
}