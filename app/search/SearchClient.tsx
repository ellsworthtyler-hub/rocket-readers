//  FILE: app/search/SearchClient.tsx
//  Library search against rr_book_metadata + rr_book
//  Theme filter uses rr_book.theme parent groups (not legacy Animals/Fairy Tales labels).
//  The first page of results is fetched on the server (app/search/page.tsx) and passed in,
//  so book cards are in the HTML; filter changes re-query from the client.

'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BookCard } from '@/components/BookCard';
import { BadgeLegend } from '@/components/BadgeLegend';
import { RR_PARENT_THEMES } from '@/lib/themes';
import {
  SEARCH_PAGE_SIZE as PAGE_SIZE,
  fetchLibraryStats,
  fetchSearchPage,
  type SearchBook,
} from '@/lib/searchQuery';

export default function SearchClient({
  initialTheme,
  initialBooks,
  initialTotal,
  initialStats,
  initialThemeOptions,
}: {
  initialTheme: string;
  initialBooks: SearchBook[];
  initialTotal: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialStats: any;
  initialThemeOptions: { theme: string; count: number }[];
}) {
  const preSelectedTheme = initialTheme;

  const [books, setBooks] = useState<SearchBook[]>(initialBooks);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(initialTotal);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [libraryStats, setLibraryStats] = useState<any>(initialStats);
  /** Themes that currently have at least one processed book (for dropdown order/counts) */
  const themeOptions = initialThemeOptions;

  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [theme, setTheme] = useState(preSelectedTheme);
  const [minDolch, setMinDolch] = useState('0');
  const [minFry, setMinFry] = useState('0');
  const [minDialog, setMinDialog] = useState('0');
  const [minFlesch, setMinFlesch] = useState('0');
  const [variability, setVariability] = useState('0');
  const [sentenceTier, setSentenceTier] = useState('0');
  const [wordTier, setWordTier] = useState('0');
  const [wordLength, setWordLength] = useState('0');

  const [sortBy, setSortBy] = useState('dolch_percentage');

  const updateFilter = (setter: React.Dispatch<React.SetStateAction<string>>) => (val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleTextSearch = () => {
    setActiveSearch(searchInput);
    setCurrentPage(1);
  };

  // Keep local theme state in sync if ?theme= changes via client navigation
  useEffect(() => {
    setTheme(preSelectedTheme);
  }, [preSelectedTheme]);

  // The server already rendered the first page for the initial filters; skip that fetch once.
  const skipInitialFetch = useRef(true);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    let cancelled = false;
    const fetchBooks = async () => {
      setLoading(true);
      if (!libraryStats) {
        const stats = await fetchLibraryStats();
        if (!cancelled && stats) setLibraryStats(stats);
      }
      const result = await fetchSearchPage({
        activeSearch,
        theme,
        minDolch,
        minFry,
        minFlesch,
        minDialog,
        variability,
        sentenceTier,
        wordTier,
        wordLength,
        sortBy,
        currentPage,
      });
      if (cancelled) return;
      if (result) {
        setBooks(result.books);
        setTotalBooks(result.total);
      }
      setLoading(false);
    };

    fetchBooks();
    return () => {
      cancelled = true;
    };
    // libraryStats is only a one-time fallback load, not a trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeSearch,
    theme,
    minDolch,
    minFry,
    minFlesch,
    minDialog,
    variability,
    sentenceTier,
    wordTier,
    wordLength,
    sortBy,
    currentPage,
  ]);

  const totalPages = Math.ceil(totalBooks / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-20">
      <h1 className="cosmic-title text-4xl md:text-5xl text-center mb-3">
        🔍 Search the Archive
      </h1>
      <p className="text-center text-slate-400 mb-3 font-bold">
        Target books with sight-word density, dialogue, length, and theme.
      </p>
      <p className="text-center mb-10">
        <Link href="/parts-of-speech" className="text-emerald-300 font-bold hover:underline">Search by part of speech</Link>
      </p>

      <div className="max-w-3xl mx-auto mb-8 flex gap-3 flex-wrap sm:flex-nowrap">
        <input
          type="text"
          placeholder="Search by Title..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTextSearch();
          }}
          className="cosmic-input"
        />
        <button type="button" onClick={handleTextSearch} className="btn-chunky shrink-0">
          Search
        </button>
      </div>

      <div className="cosmic-filters">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-slate-100 text-lg">⚙️ Mission filters</h3>
          <button
            onClick={() => {
              setTheme('');
              setMinDolch('0');
              setMinFry('0');
              setMinDialog('0');
              setVariability('0');
              setSentenceTier('0');
              setWordTier('0');
              setWordLength('0');
              setMinFlesch('0');
              setSearchInput('');
              setActiveSearch('');
              setCurrentPage(1);
              setSortBy('dolch_percentage');
            }}
            className="text-xs text-rose-300 hover:text-rose-200 hover:underline font-bold"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <FilterSelect label="Order Results By" value={sortBy} setter={updateFilter(setSortBy)}>
              <option value="dolch_percentage">Dolch % (Highest)</option>
              <option value="fry_percentage">Fry % (Highest)</option>
              <option value="dialog_percentage">Dialogue % (Highest)</option>
              <option value="flesch_grade">Flesch Grade (Easiest)</option>
              <option value="total_words">Length (Longest)</option>
            </FilterSelect>
          </div>

          <FilterSelect label="Theme" value={theme} setter={updateFilter(setTheme)}>
            <option value="">All Themes</option>
            {/*
              Options match rr_book.theme parent groups from the pipeline
              (Literature, History, Science & Technology, …).
              Legacy labels like Animals / Fairy Tales / Adventure are not stored
              as parent themes — Adventure is a Literature sub-category.
            */}
            {(themeOptions.length > 0
              ? themeOptions
              : RR_PARENT_THEMES.map((t) => ({ theme: t, count: 0 }))
            ).map(({ theme: t, count }) => (
              <option key={t} value={t}>
                {count > 0 ? `${t} (${count.toLocaleString()})` : t}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Min Dolch %" value={minDolch} setter={updateFilter(setMinDolch)}>
            <option value="0">Any %</option>
            <option value="20">20%+</option>
            <option value="30">30%+</option>
            <option value="40">40%+</option>
            <option value="50">50%+</option>
            <option value="60">60%+</option>
            <option value="70">70%+</option>
            <option value="80">80%+</option>
          </FilterSelect>

          <FilterSelect label="Min Fry %" value={minFry} setter={updateFilter(setMinFry)}>
            <option value="0">Any %</option>
            <option value="20">20%+</option>
            <option value="30">30%+</option>
            <option value="40">40%+</option>
            <option value="50">50%+</option>
            <option value="60">60%+</option>
            <option value="70">70%+</option>
            <option value="80">80%+</option>
          </FilterSelect>

          <FilterSelect label="Dialogue %" value={minDialog} setter={updateFilter(setMinDialog)}>
            <option value="0">Any %</option>
            <option value="10">10%+</option>
            <option value="20">20%+</option>
            <option value="30">30%+</option>
            <option value="40">40%+</option>
            <option value="50">50%+</option>
          </FilterSelect>

          <FilterSelect
            label="Length (Sentences)"
            value={sentenceTier}
            setter={updateFilter(setSentenceTier)}
          >
            <option value="0">Any Length</option>
            <option value="100">≤ 100 Sentences</option>
            <option value="500">≤ 500 Sentences</option>
            <option value="1500">≤ 1500 Sentences</option>
            <option value="5000">≤ 5000 Sentences</option>
            <option value="over_5000">{'>'} 5000 Sentences</option>
          </FilterSelect>

          <FilterSelect label="Length (Words)" value={wordTier} setter={updateFilter(setWordTier)}>
            <option value="0">Any Length</option>
            <option value="500">≤ 500 Words</option>
            <option value="2000">≤ 2,000 Words</option>
            <option value="10000">≤ 10,000 Words</option>
            <option value="30000">≤ 30,000 Words</option>
            <option value="over_30000">{'>'} 30,000 Words</option>
          </FilterSelect>

          <FilterSelect
            label="Lexical Variety"
            value={variability}
            setter={updateFilter(setVariability)}
          >
            <option value="0">Any Ratio</option>
            <option value="0.1">≥ 10% Unique</option>
            <option value="0.2">≥ 20% Unique</option>
            <option value="0.3">≥ 30% Unique</option>
            <option value="0.4">≥ 40% Unique</option>
          </FilterSelect>

          <FilterSelect
            label="Avg Word Length"
            value={wordLength}
            setter={updateFilter(setWordLength)}
          >
            <option value="0">Any Length</option>
            <option value="3">≥ 3 Letters</option>
            <option value="4">≥ 4 Letters</option>
            <option value="5">≥ 5 Letters</option>
          </FilterSelect>

          <FilterSelect label="Flesch Ease" value={minFlesch} setter={updateFilter(setMinFlesch)}>
            <option value="0">Any Difficulty</option>
            <option value="50">≥ 50 (Fair)</option>
            <option value="70">≥ 70 (Easy)</option>
            <option value="80">≥ 80 (Very Easy)</option>
            <option value="90">≥ 90 (Pre-K/Kinder)</option>
          </FilterSelect>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 px-2">
        <p className="text-slate-400 font-bold">
          Showing{' '}
          <span className="text-emerald-300">
            {totalBooks > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + PAGE_SIZE, totalBooks)}
          </span>{' '}
          of <span className="text-slate-100">{totalBooks.toLocaleString()}</span> books
        </p>
      </div>

      <BadgeLegend />

      {loading ? (
        <div className="text-emerald-300 text-center py-24 text-2xl font-display font-bold animate-pulse">
          Searching the cosmos...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {books.length > 0 ? (
            books.map((book) => <BookCard key={book.id} {...book} libraryStats={libraryStats} />)
          ) : (
            <div className="col-span-full text-center py-12 text-slate-400 font-semibold">
              No books found matching these filters. Try adjusting your search!
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-16">
          <button
            onClick={() => {
              setCurrentPage(currentPage - 1);
              window.scrollTo(0, 0);
            }}
            disabled={currentPage === 1}
            className="btn-chunky-secondary text-sm py-2.5 px-5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-slate-400 font-bold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => {
              setCurrentPage(currentPage + 1);
              window.scrollTo(0, 0);
            }}
            disabled={currentPage === totalPages}
            className="btn-chunky text-sm py-2.5 px-5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  setter,
  children,
}: {
  label: string;
  value: string;
  setter: (val: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 ml-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => setter(e.target.value)}
        className="cosmic-select"
      >
        {children}
      </select>
    </div>
  );
}
