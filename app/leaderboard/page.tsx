//  FILE: app/leaderboard/page.tsx
//  Top books from rr_book_metadata

'use client';

import { useEffect, useState, useMemo } from 'react';
import { BookCard } from '@/components/BookCard';
import { supabase } from '@/lib/supabaseClient';
import { BadgeLegend } from '@/components/BadgeLegend';
import { isQuarantinedSourceId } from '@/lib/contentQuarantine';
import { enabledExtraSources, sourceInfo, type BookSource } from '@/lib/bookSources';
import { SourceIcon } from '@/components/ui/SourceIcon';

interface Book {
  id: string;
  source: string;
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
  // Optional source filter; Gutenberg is the default (and the only source in library_percentiles).
  const [source, setSource] = useState<BookSource>('gutenberg');
  const sourceOptions: BookSource[] = ['gutenberg', ...enabledExtraSources().filter((s) => s !== 'gutenberg_au')];

  useEffect(() => {
    const fetchBooksFromSupabase = async () => {
      setLoading(true);

      if (source !== 'gutenberg') {
        // Non-Gutenberg sources: rr_book_listing / library_percentiles_by_source views
        // (sql/2026-11-03_multi_source_listing.sql) only expose books that passed QA 4b-4d
        // and are not quarantined.
        const { data: statsData } = await supabase
          .from('library_percentiles_by_source')
          .select('*')
          .eq('source', source)
          .maybeSingle();
        setLibraryStats(statsData ?? null);
        const { data, error } = await supabase
          .from('rr_book_listing')
          .select('book_id, source, source_id, title, author, dolch_percentage, fry_percentage, dialog_percentage, flesch_grade')
          .eq('source', source)
          .order('dolch_percentage', { ascending: false, nullsFirst: false })
          .limit(500);
        if (error) console.error('Error fetching leaderboard books:', error);
        setBooks(
          (data || []).map((b: any) => ({
            id: String(b.source_id),
            source: b.source,
            title: b.title || `Book ${b.book_id}`,
            author: b.author || 'Unknown Author',
            dolch: b.dolch_percentage?.toString() || '0',
            fry: b.fry_percentage?.toString() || '0',
            fleschGrade: b.flesch_grade?.toString() || '0',
            dialogRatio: b.dialog_percentage?.toString() || '0',
          }))
        );
        setLoading(false);
        return;
      }
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
        .eq('rr_book.source', 'gutenberg')
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
          source: 'gutenberg',
          title: rr?.title || `Book ${b.book_id}`,
          author: rr?.author || 'Unknown Author',
          dolch: b.dolch_percentage?.toString() || '0',
          fry: b.fry_percentage?.toString() || '0',
          fleschGrade: b.flesch_grade?.toString() || '0',
          dialogRatio: b.dialog_percentage?.toString() || '0',
        };
      }).filter((bk) => !isQuarantinedSourceId(bk.id));

      setBooks(formatted);
      setLoading(false);
    };

    fetchBooksFromSupabase();
  }, [source]);

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
    <div className="max-w-7xl mx-auto px-6 py-16 pb-20">
      <div className="text-center mb-12">
        <div className="text-5xl mb-2" aria-hidden>
          🏆
        </div>
        <h1 className="cosmic-title text-4xl md:text-5xl mb-3">The Leaderboard</h1>
        <p className="text-slate-400 text-lg mb-8 font-bold">
          Top 100 books ranked by key literacy metrics
        </p>

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
              type="button"
              onClick={() => setSortBy(option.key as any)}
              className={
                sortBy === option.key
                  ? 'btn-chunky text-sm py-2 px-5'
                  : 'px-5 py-2.5 rounded-full font-display font-bold text-sm bg-slate-800 border-2 border-slate-600 text-slate-200 hover:border-emerald-400 transition'
              }
            >
              {option.label}
            </button>
          ))}
        </div>
        {sourceOptions.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6" role="group" aria-label="Book source">
            {sourceOptions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                aria-pressed={source === s}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border-2 transition ${
                  source === s
                    ? 'border-emerald-400 bg-slate-700 text-white'
                    : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-emerald-400'
                }`}
              >
                <SourceIcon source={s} size={18} />
                {sourceInfo(s).label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-emerald-300 text-center py-24 text-2xl font-display font-bold animate-pulse">
          Loading Leaderboard...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sortedBooks.map((book) => (
            <BookCard key={`${book.source}:${book.id}`} {...book} libraryStats={libraryStats} />
          ))}
          {sortedBooks.length === 0 && (
            <p className="col-span-full text-center text-slate-400 py-12 font-semibold">
              No processed books yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
