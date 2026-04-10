// app/leaderboard/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { BookCard } from '@/components/BookCard';
import { loadBooks, Book } from '@/lib/data';

export default function LeaderboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'dolch' | 'fry' | 'dialog' | 'flesch'>('dolch');

  useEffect(() => {
    const fetchBooks = async () => {
      const allBooks = await loadBooks();
      setBooks(allBooks);
      setLoading(false);
    };
    fetchBooks();
  }, []);

  const sortedBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => {
        let valA = 0, valB = 0;
        switch (sortBy) {
          case 'dolch': valA = parseFloat(a.dolch); valB = parseFloat(b.dolch); break;
          case 'fry':   valA = parseFloat(a.fry);   valB = parseFloat(b.fry); break;
          case 'dialog': valA = parseFloat(a.dialogRatio); valB = parseFloat(b.dialogRatio); break;
          case 'flesch': valA = parseFloat(a.fleschGrade); valB = parseFloat(b.fleschGrade); break;
        }
        return valB - valA;
      })
      .slice(0, 100); // ← Cap at 100 cards
  }, [books, sortBy]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-xl">Loading leaderboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">Leaderboard</h1>
      <p className="text-slate-600 text-lg mb-8">Top 100 books ranked by key metrics</p>

      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { key: 'dolch', label: 'Dolch %' },
          { key: 'fry', label: 'Fry %' },
          { key: 'dialog', label: 'Dialogue %' },
          { key: 'flesch', label: 'Flesch Grade' },
        ].map((option) => (
          <button
            key={option.key}
            onClick={() => setSortBy(option.key as any)}
            className={`px-6 py-2.5 rounded-2xl font-medium transition-all ${
              sortBy === option.key
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 hover:border-emerald-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedBooks.map((book, index) => (
          <div key={book.id} className="relative">
            <div className="absolute -top-3 -left-3 bg-emerald-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center z-10 shadow">
              {index + 1}
            </div>
            <BookCard
              id={book.id}
              title={book.title}
              author={book.author}
              dolch={book.dolch}
              fry={book.fry}
              dialogRatio={book.dialogRatio}
              fleschGrade={book.fleschGrade}
            />
          </div>
        ))}
      </div>
    </div>
  );
}