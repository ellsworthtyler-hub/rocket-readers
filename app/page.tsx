//  FILE: app/page.tsx
//  Homepage — processed books from rr_book_metadata

import Link from 'next/link';
import { BookCard } from '../components/BookCard';
import { BadgeLegend } from '@/components/BadgeLegend';
import {
  getGlobalStats,
  getLibraryPercentiles,
  listProcessedBooks,
} from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [{ books: hotBooks }, stats, libraryStats] = await Promise.all([
    listProcessedBooks({ page: 1, pageSize: 6, sortBy: 'dolch_percentage' }),
    getGlobalStats(),
    getLibraryPercentiles(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-white border-b border-slate-200 py-16 md:py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Rocket Reader
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
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

      {/* Parent / teacher intro — under title block, above Hot off the Launchpad */}
      <section className="bg-slate-50 border-b border-slate-200 px-6 py-12 md:py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-5 text-center tracking-tight">
            Built for parents, teachers, and young readers
          </h2>
          <div className="space-y-4 text-slate-600 text-base md:text-lg leading-relaxed">
            <p>
              Every book in Rocket Reader is analyzed for the literacy building blocks that matter
              most in early reading: high-frequency{' '}
              <strong className="text-slate-800">Dolch and Fry sight words</strong>,{' '}
              <strong className="text-slate-800">Heart words</strong> with irregular spellings,
              clear <strong className="text-slate-800">syllable patterns</strong>, dialogue density,
              readability level, and parts of speech. Those measures help you see—at a glance—how
              approachable a text will feel for a developing or ESL reader, and which skills the
              story will naturally reinforce.
            </p>
            <p>
              Free tools let you explore the library, study book-level stats, and open a sample of
              our enhanced ebook with interactive highlights. Premium unlocks the full interactive
              edition and book-specific classwork packets so students can practice the same words
              and patterns they meet in the story—building fluent word recognition so more
              attention is free for comprehension and joy in reading.{' '}
              <Link href="/about" className="text-emerald-700 font-semibold hover:underline">
                Learn more about the research behind our approach →
              </Link>
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Hot off the Launchpad</h2>
          <Link href="/search" className="text-emerald-600 font-bold hover:underline">
            See all books →
          </Link>
        </div>

        <BadgeLegend />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotBooks.map((book) => (
            <BookCard key={book.id} {...book} libraryStats={libraryStats} />
          ))}
          {hotBooks.length === 0 && (
            <p className="col-span-full text-center text-slate-500 py-12">
              Processed books will appear here as the library pipeline completes.
            </p>
          )}
        </div>
      </div>

      <div className="bg-emerald-50 border-y border-emerald-100 py-16 mt-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-5xl font-bold text-emerald-600 mb-2">
              {stats.totalBooks.toLocaleString()}
            </div>
            <div className="text-slate-600 font-medium">Books Analyzed</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-emerald-600 mb-2">{stats.avgDolch}%</div>
            <div className="text-slate-600 font-medium">Average Dolch Density</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-amber-500 mb-2">{stats.avgFry}%</div>
            <div className="text-slate-600 font-medium">Average Fry Density</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h3 className="text-2xl font-bold text-slate-800 mb-4">
          Ready to accelerate reading comprehension?
        </h3>
        <p className="text-slate-600 mb-8 max-w-2xl mx-auto text-lg">
          Teachers, homeschoolers, and ESL instructors use Rocket Reader to choose texts that match
          their students&apos; sight-word readiness—and to practice those words in context.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-3 bg-slate-900 text-white font-bold px-8 py-4 rounded-2xl hover:bg-slate-800 transition shadow-sm"
          >
            Explore the Archive
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-800 font-bold px-8 py-4 rounded-2xl hover:border-emerald-400 transition"
          >
            About Our Approach
          </Link>
        </div>
      </div>
    </div>
  );
}
