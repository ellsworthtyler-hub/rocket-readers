//  FILE: app/leaderboard/page.tsx
//  Top books from rr_book_metadata

'use client';

import { useEffect, useState, useMemo } from 'react';
import { BookCard } from '@/components/BookCard';
import { supabase } from '@/lib/supabaseClient';
import { BadgeLegend } from '@/components/BadgeLegend';

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
  const [libraryStats, setLibraryStats] = useState<any>(null);

  useEffect(() => {
    const fetchBooksFromSupabase = async () => {
      setLoading(true);

      const { data: statsData } = await supabase
        .from('library_percentiles')
        .select('*')
        .maybeSingle();
      if (statsData) setLibraryStats(statsData);

      const { data, error } = await supabase
        .from('rr_book_metadata')
        .select(
          `
          book_id,
          dolch_percentage,
          fry_percentage,
          dialog_percentage,
          flesch_grade,
          last_processed,
          rr_book!inner (
            source_id,
            title,
            author
          )
        `
        )
        .not('last_processed', 'is', null)
        .order('dolch_percentage', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching leaderboard books:', error);
        setLoading(false);
        return;
      }

      const formatted: Book[] = (data || []).map((b: any) => {
        const rr = Array.isArray(b.rr_book) ? b.rr_book[0] : b.rr_book;
        return {
          id: String(rr?.source_id ?? b.book_id),
          title: rr?.title || `Book ${b.book_id}`,
          author: rr?.author || 'Unknown Author',
          dolch: b.dolch_percentage?.toString() || '0',
          fry: b.fry_percentage?.toString() || '0',
          fleschGrade: b.flesch_grade?.toString() || '0',
          dialogRatio: b.dialog_percentage?.toString() || '0',
        };
      });

      setBooks(formatted);
      setLoading(false);
    };

    fetchBooksFromSupabase();
  }, []);

  const sortedBooks = useMemo(() => {
    const sorted = [...books];
    if (sortBy === 'dolch') {
      sorted.sort((a, b) => parseFloat(b.dolch) - parseFloat(a.dolch));
    } else if (sortBy === 'fry') {
      sorted.sort((a, b) => parseFloat(b.fry) - parseFloat(a.fry));
    } else if (sortBy === 'dialog') {
      sorted.sort((a, b) => parseFloat(b.dialogRatio) - parseFloat(a.dialogRatio));
    } else if (sortBy === 'flesch') {
      sorted.sort((a, b) => parseFloat(a.fleschGrade) - parseFloat(b.fleschGrade));
    }
    return sorted.slice(0, 100);
  }, [books, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          The Leaderboard
        </h1>
        <p className="text-slate-600 text-lg mb-8">Top 100 books ranked by key metrics</p>

        <BadgeLegend />

        <div className="flex flex-wrap justify-center gap-3 mb-8">
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
      </div>

      {loading ? (
        <div className="text-slate-800 text-center py-24 text-2xl font-bold animate-pulse">
          Loading Leaderboard...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedBooks.map((book) => (
            <BookCard key={book.id} {...book} libraryStats={libraryStats} />
          ))}
          {sortedBooks.length === 0 && (
            <p className="col-span-full text-center text-slate-500 py-12">
              No processed books yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
