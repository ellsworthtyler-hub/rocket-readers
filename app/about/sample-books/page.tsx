import type { Metadata } from 'next';
import Link from 'next/link';
import { SAMPLE_FULL_BOOKS, SAMPLE_FULL_BOOK_SLOTS } from '@/lib/sampleBooks';

export const metadata: Metadata = {
  title: 'Try a full book free',
  alternates: { canonical: '/about/sample-books' },
  description: 'Read complete Rocket Readers editions free before you subscribe.',
};

export default function SampleBooksPage() {
  const slots = Array.from({ length: SAMPLE_FULL_BOOK_SLOTS }, (_, i) => SAMPLE_FULL_BOOKS[i] ?? null);
  return (
    <div className="py-12 md:py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-calm-serif text-4xl md:text-5xl font-bold text-slate-900 mb-6 text-center tracking-tight">
          Try a full book free
        </h1>
        <p className="text-center text-slate-600 mb-8">
          Read a complete enhanced edition, with sight-word highlights and reading stats, before you subscribe.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {slots.map((book, i) =>
            book ? (
              <Link key={book.sourceId} href={`/book/${book.sourceId}`} className="calm-card block hover:shadow-lg">
                <h2 className="font-bold text-slate-900">{book.title}</h2>
                <p className="text-sm text-slate-500">{book.author}</p>
                {book.blurb && <p className="text-sm mt-2">{book.blurb}</p>}
              </Link>
            ) : (
              <div key={`slot-${i}`} className="calm-card text-center text-slate-500 font-semibold">
                Coming soon
              </div>
            )
          )}
        </div>
        <p className="text-center mt-10">
          <Link href="/about" className="text-emerald-700 font-semibold hover:underline">
            ← Back to About Us
          </Link>
        </p>
      </div>
    </div>
  );
}
