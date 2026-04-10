// app/book/[id]/page.tsx
import { notFound } from 'next/navigation';
import { loadBooks } from '@/lib/data';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import RocketReader from '@/components/RocketReader';   // ← FIXED: default import (no curly braces)

export default async function BookStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const allBooks = await loadBooks();
  const book = allBooks.find((b) => b.id === id);

  if (!book) notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link href="/search" className="text-emerald-600 hover:underline mb-8 inline-block">
        ← Back to Library
      </Link>

      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900">{book.title}</h1>
        {book.author && <p className="text-slate-600 text-xl mt-2">{book.author}</p>}
      </div>

      {/* The Big 4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
          <div className="text-sm text-emerald-600 font-medium">Dolch Density</div>
          <div className="text-5xl font-bold text-emerald-700 mt-2">{book.dolch}%</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
          <div className="text-sm text-amber-600 font-medium">Fry Density</div>
          <div className="text-5xl font-bold text-amber-700 mt-2">{book.fry}%</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
          <div className="text-sm text-sky-600 font-medium">Dialogue Ratio</div>
          <div className="text-5xl font-bold text-sky-700 mt-2">{book.dialogRatio}%</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
          <div className="text-sm text-violet-600 font-medium">Flesch Grade</div>
          <div className="text-5xl font-bold text-violet-700 mt-2">{book.fleschGrade}</div>
        </div>
      </div>

      {/* Core Text Metrics + Dolch Breadth + POS + Word Length (unchanged from your original) */}
      {/* ... (keep all your existing stats, tables, and charts here) ... */}

      <div className="mt-12 text-center">
        <ClientBookAction id={book.id} />
      </div>
    </div>
  );
}

// Client component that checks premium status
function ClientBookAction({ id }: { id: string }) {
  const { isPremium } = useAuth();

  if (isPremium) {
    return (
      <a
        href={`/analyze/${id}`}
        className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-10 py-4 rounded-3xl transition text-lg"
      >
        Open Full Rocket Reader Edition →
      </a>
    );
  }

  return (
    <div className="text-center">
      <p className="text-slate-600 mb-4">This is a Sample preview.</p>
      <a
        href="/premium"
        className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-10 py-4 rounded-3xl transition text-lg"
      >
        Upgrade to Premium to unlock full interactive edition
      </a>
    </div>
  );
}