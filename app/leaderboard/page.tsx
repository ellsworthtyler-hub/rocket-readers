//  FILE:  app/leaderboard/page.tsx
//  =================================

'use client';

import { useEffect, useState, useMemo } from 'react';
import { BookCard } from '@/components/BookCard'; 
import { supabase } from '@/lib/supabaseClient';
import { getAllProcessedBooks } from '@/lib/data';
import { BadgeLegend } from "@/components/BadgeLegend";

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
  
  // NEW: State to hold the dynamic database percentiles
  const [libraryStats, setLibraryStats] = useState<any>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);

      // Fetch dynamic badge percentiles (still from legacy table for now)
      const { data: statsData, error: statsError } = await supabase
        .from('library_percentiles')
        .select('*')
        .single();
        
      if (statsError) console.error("Failed to load library percentiles:", statsError);
      if (statsData) setLibraryStats(statsData);

      // Fetch only books that have gone through the new rr_ processing pipeline
      const processedBooks = await getAllProcessedBooks();

      setBooks(processedBooks as Book[]);
      setLoading(false);
    };

    fetchBooks();
  }, []);

  // Sort the books in memory based on the selected button
  const sortedBooks = useMemo(() => {
    const sorted = [...books];
    if (sortBy === 'dolch') {
      sorted.sort((a, b) => parseFloat(b.dolch) - parseFloat(a.dolch));
    } else if (sortBy === 'fry') {
      sorted.sort((a, b) => parseFloat(b.fry) - parseFloat(a.fry));
    } else if (sortBy === 'dialog') {
      sorted.sort((a, b) => parseFloat(b.dialogRatio) - parseFloat(a.dialogRatio));
    } else if (sortBy === 'flesch') {
      // FLESCH LOGIC: Sort ascending (lowest grade level is ranked highest)
      sorted.sort((a, b) => parseFloat(a.fleschGrade) - parseFloat(b.fleschGrade)); 
    }
    return sorted.slice(0, 100); // Only return the Top 100 for the Leaderboard
  }, [books, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">The Leaderboard</h1>
        <p className="text-slate-600 text-lg mb-8">Top 100 books ranked by key metrics</p>

        {/* --- BADGELEGEND COMPONENT --- */}
        <BadgeLegend />
        {/* ----------------------------- */}

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
         <div className="text-slate-800 text-center py-24 text-2xl font-bold animate-pulse">Loading Leaderboard...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedBooks.map((book) => (
            <BookCard 
              key={book.id} 
              {...book} 
              libraryStats={libraryStats} // Pass the dynamic stats down!
            />
          ))}
        </div>
      )}
    </div>
  );
}