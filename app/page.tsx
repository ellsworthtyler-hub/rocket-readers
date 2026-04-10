// app/page.tsx
import Link from 'next/link';
import { BookCard } from '@/components/BookCard';
import { loadBooks } from '@/lib/data';

export default async function HomePage() {
  const books = await loadBooks();

  // Top 6 books for "Hot off the Launchpad" (highest Dolch density)
  const hotBooks = books
    .sort((a, b) => parseFloat(b.dolch) - parseFloat(a.dolch))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-6xl font-bold mb-6 tracking-tight">
            Rocket Reader
          </h1>
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
            <p className="text-slate-600 mt-2 text-lg">
              Highest Dolch sight-word density this week
            </p>
          </div>
          <Link
            href="/search"
            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2"
          >
            See all books →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotBooks.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              author={book.author}
              dolch={book.dolch}
              fry={book.fry}
              dialogRatio={book.dialogRatio}
              fleschGrade={book.fleschGrade}
            />
          ))}
        </div>
      </div>

      {/* Quick Stats / Call to Action */}
      <div className="bg-white border-t border-b py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-5xl font-bold text-emerald-600 mb-2">{books.length.toLocaleString()}</div>
            <div className="text-slate-600">Books Analyzed</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-emerald-600 mb-2">4,892+</div>
            <div className="text-slate-600">With Real Sight-Word Data</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-emerald-600 mb-2">57.0%</div>
            <div className="text-slate-600">Average Dolch Density</div>
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