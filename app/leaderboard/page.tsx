//  FILE:  app/leaderboard/page.tsx
//  =================================

'use client';

import { useEffect, useState, useMemo } from 'react';
import { BookCard } from '@/components/BookCard'; 
import { supabase } from '@/lib/supabaseClient'; // Use the live database!

// 1. Define the Book type here so TypeScript is happy
interface Book {
  id: string;
  title: string;
  author: string;
  dolch: string;
  fry: string;
  dialogRatio: string;
  fleschGrade: string;
}

export default function LeaderboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'dolch' | 'fry' | 'dialog' | 'flesch'>('dolch');

  useEffect(() => {
  // 1. Ensure your interface matches what BookCard expects
interface Book {
  id: string;
  title: string;
  author: string;
  dolch: string;
  fry: string;
  dialogRatio: string;
  fleschGrade: string;
}

const fetchBooksFromSupabase = async () => {
  setLoading(true);
  
  // 2. Use the explicit relationship tag '!fk_book_catalog'
  const { data, error } = await supabase
    .from('book_metadata')
    .select('*, gutenberg_catalog!fk_book_catalog(title, author)') 
    .limit(100);

  if (error) {
    console.error("Leaderboard fetch error:", error);
    setLoading(false);
    return;
  }

  const formattedBooks: Book[] = (data || []).map((b: any) => {
    // 3. DEFENSIVE MAPPING: Handle the Array vs Object join result
    const catalog = Array.isArray(b.gutenberg_catalog) 
      ? b.gutenberg_catalog[0] 
      : b.gutenberg_catalog;

    return {
      id: b.book_id.toString(),
      // 4. Fallback logic to replace "Book #" with real names
      title: catalog?.title || b.title || `Book ${b.book_id}`,
      author: catalog?.author || b.author || "Unknown Author",
      dolch: b.dolch_percentage?.toString() || "0",
      fry: b.fry_percentage?.toString() || "0",
      dialogRatio: b.dialog_percentage?.toString() || "0",
      fleschGrade: b.flesch_reading_ease?.toString() || "0"
    };
  });

  setBooks(formattedBooks);
  setLoading(false);
};

  fetchBooksFromSupabase();
}, []);

  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      let valA = parseFloat(a[sortBy === 'dialog' ? 'dialogRatio' : sortBy === 'flesch' ? 'fleschGrade' : sortBy] || '0');
      let valB = parseFloat(b[sortBy === 'dialog' ? 'dialogRatio' : sortBy === 'flesch' ? 'fleschGrade' : sortBy] || '0');
      return valB - valA;
    });
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
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
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
            <BookCard {...book} />
          </div>
        ))}
      </div>
    </div>
  );
}