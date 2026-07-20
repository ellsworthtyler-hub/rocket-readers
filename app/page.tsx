//  FILE: app/page.tsx
//  Homepage — Cosmic theme

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
    <div className="pb-16">
      {/* Hero */}
      <header className="text-center px-6 pt-12 md:pt-16 pb-6 max-w-4xl mx-auto">
        <div className="text-5xl md:text-6xl mb-3 drop-shadow-lg" aria-hidden>
          🚀📚✨
        </div>
        <h1 className="cosmic-title text-5xl md:text-6xl mb-4">Rocket Reader</h1>
        <p className="text-lg md:text-xl text-slate-300 font-bold max-w-xl mx-auto mb-8">
          Find books with the highest sight-word coverage for your readers.
        </p>
        <Link href="/search" className="btn-chunky text-lg">
          Browse the Full Library →
        </Link>
      </header>

      {/* Selling points */}
      <section className="px-6 py-8">
        <div className="cosmic-panel max-w-3xl mx-auto space-y-4 text-base md:text-lg">
          <p>
            Rocket Readers turns classic public-domain books into powerful literacy tools by
            analyzing every text for the exact building blocks young readers and English learners
            need most. Our engine measures Dolch and Fry sight-word coverage, dialogue ratio,
            word-length patterns, readability scores, and part-of-speech balance—then delivers
            clear progress reports plus ready-to-use classroom packets packed with vocabulary
            sheets, flashcards, memory games, spelling and sentence scramblers, word searches, and
            more—all drawn directly from the book itself.
          </p>
          <p>
            Parents and teachers finally get transparent data on how &ldquo;sight-word dense&rdquo; a
            story really is, plus engaging, book-specific practice that builds automatic
            recognition, fluency, and confidence. Whether you are supporting a beginning reader, an
            ESL student, or a whole classroom, Rocket Readers makes high-quality, research-aligned
            materials free and instantly usable so every child can experience the joy of successful
            reading.{' '}
            <Link href="/about">Learn more about our approach →</Link>
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            🔥 Hot off the Launchpad
          </h2>
          <Link
            href="/search"
            className="text-emerald-300 font-extrabold hover:text-emerald-200 transition"
          >
            See all books →
          </Link>
        </div>

        <BadgeLegend />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hotBooks.map((book) => (
            <BookCard key={book.id} {...book} libraryStats={libraryStats} />
          ))}
          {hotBooks.length === 0 && (
            <p className="col-span-full text-center text-slate-400 py-12 font-semibold">
              Processed books will appear here as the library pipeline completes.
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-4">
        <div className="cosmic-banner">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div>
              <div className="font-display text-4xl md:text-5xl font-bold mb-1">
                {stats.totalBooks.toLocaleString()}
              </div>
              <div className="font-semibold opacity-90">Books Analyzed</div>
            </div>
            <div>
              <div className="font-display text-4xl md:text-5xl font-bold mb-1">
                {stats.avgDolch}%
              </div>
              <div className="font-semibold opacity-90">Average Dolch Density</div>
            </div>
            <div>
              <div className="font-display text-4xl md:text-5xl font-bold mb-1 text-amber-200">
                {stats.avgFry}%
              </div>
              <div className="font-semibold opacity-90">Average Fry Density</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
          Ready to accelerate reading comprehension?
        </h3>
        <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg font-semibold">
          Teachers, homeschoolers, and ESL instructors use Rocket Reader to choose texts that match
          their students&apos; sight-word readiness—and to practice those words in context.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/search" className="btn-chunky">
            Explore the Archive
          </Link>
          <Link href="/about" className="btn-chunky-secondary">
            About Us
          </Link>
        </div>
      </div>
    </div>
  );
}
