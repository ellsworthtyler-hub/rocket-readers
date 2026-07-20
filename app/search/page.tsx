//  FILE: app/search/page.tsx
//  Library search against rr_book_metadata + rr_book

'use client';
import { useState, useEffect, Suspense } from 'react';
import { BookCard } from '@/components/BookCard';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams } from 'next/navigation';
import { BadgeLegend } from '@/components/BadgeLegend';

interface Book {
  id: string;
  title: string;
  author: string;
  dolch: string;
  fry: string;
  fleschGrade: string;
  dialogRatio: string;
}

const PAGE_SIZE = 100;

const LIST_SELECT = `
  book_id,
  dolch_percentage,
  fry_percentage,
  dialog_percentage,
  flesch_grade,
  flesch_reading_ease,
  total_words,
  total_sentences,
  word_variability_ratio,
  avg_word_length,
  last_processed,
  rr_book!inner (
    source_id,
    title,
    author,
    theme
  )
`;

function SearchContent() {
  const searchParams = useSearchParams();
  const preSelectedTheme = searchParams.get('theme') || '';

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [libraryStats, setLibraryStats] = useState<any>(null);

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

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);

      // Percentiles: try view, else lightweight client compute is skipped (home/book handle compute)
      const { data: statsData } = await supabase.from('library_percentiles').select('*').maybeSingle();
      if (statsData) setLibraryStats(statsData);

      let query = supabase
        .from('rr_book_metadata')
        .select(LIST_SELECT, { count: 'exact' })
        .not('last_processed', 'is', null);

      if (minDolch !== '0') query = query.gte('dolch_percentage', parseFloat(minDolch));
      if (minFry !== '0') query = query.gte('fry_percentage', parseFloat(minFry));
      // Flesch Ease filter (higher = easier)
      if (minFlesch !== '0') query = query.gte('flesch_reading_ease', parseFloat(minFlesch));
      if (minDialog !== '0') query = query.gte('dialog_percentage', parseFloat(minDialog));
      if (variability !== '0') query = query.gte('word_variability_ratio', parseFloat(variability));
      if (wordLength !== '0') query = query.gte('avg_word_length', parseFloat(wordLength));

      if (sentenceTier !== '0') {
        if (sentenceTier === 'over_5000') query = query.gte('total_sentences', 5000);
        else query = query.lte('total_sentences', parseInt(sentenceTier, 10));
      }

      if (wordTier !== '0') {
        if (wordTier === 'over_30000') query = query.gte('total_words', 30000);
        else query = query.lte('total_words', parseInt(wordTier, 10));
      }

      if (theme !== '') query = query.ilike('rr_book.theme', `%${theme}%`);
      if (activeSearch !== '') query = query.ilike('rr_book.title', `%${activeSearch}%`);

      if (sortBy === 'flesch_grade' || sortBy === 'flesch_reading_ease') {
        query = query.order('flesch_grade', { ascending: true, nullsFirst: false });
      } else {
        query = query.order(sortBy, { ascending: false, nullsFirst: false });
      }

      const startIndex = (currentPage - 1) * PAGE_SIZE;
      query = query.range(startIndex, startIndex + PAGE_SIZE - 1);

      const { data, count, error } = await query;

      if (error) {
        console.error('Supabase fetch error:', error);
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
      setTotalBooks(count || 0);
      setLoading(false);
    };

    fetchBooks();
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
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-bold text-center mb-4 text-slate-900 tracking-tight">
        Search the Rocket Reader Archive
      </h1>
      <p className="text-center text-slate-500 mb-10">
        Help target your search with these highly specific filters.
      </p>

      <div className="max-w-3xl mx-auto mb-8 flex gap-3">
        <input
          type="text"
          placeholder="Search by Title..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTextSearch();
          }}
          className="w-full bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-2xl px-6 py-4 text-lg text-slate-900 focus:outline-none shadow-sm transition-all"
        />
        <button
          onClick={handleTextSearch}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 rounded-2xl shadow-sm transition-all"
        >
          Search
        </button>
      </div>

      <div className="bg-slate-100 rounded-3xl p-6 mb-12 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Advanced Analytics Filters</h3>
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
            className="text-xs text-red-500 hover:underline font-bold"
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
            <option value="Animals">Animals</option>
            <option value="Fairy Tales">Fairy Tales</option>
            <option value="History">History</option>
            <option value="Adventure">Adventure</option>
            <option value="Science">Science</option>
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
            <option value="100">&le; 100 Sentences</option>
            <option value="500">&le; 500 Sentences</option>
            <option value="1500">&le; 1500 Sentences</option>
            <option value="5000">&le; 5000 Sentences</option>
            <option value="over_5000">&gt; 5000 Sentences</option>
          </FilterSelect>

          <FilterSelect label="Length (Words)" value={wordTier} setter={updateFilter(setWordTier)}>
            <option value="0">Any Length</option>
            <option value="500">&le; 500 Words</option>
            <option value="2000">&le; 2,000 Words</option>
            <option value="10000">&le; 10,000 Words</option>
            <option value="30000">&le; 30,000 Words</option>
            <option value="over_30000">&gt; 30,000 Words</option>
          </FilterSelect>

          <FilterSelect
            label="Lexical Variety"
            value={variability}
            setter={updateFilter(setVariability)}
          >
            <option value="0">Any Ratio</option>
            <option value="0.1">&ge; 10% Unique</option>
            <option value="0.2">&ge; 20% Unique</option>
            <option value="0.3">&ge; 30% Unique</option>
            <option value="0.4">&ge; 40% Unique</option>
          </FilterSelect>

          <FilterSelect
            label="Avg Word Length"
            value={wordLength}
            setter={updateFilter(setWordLength)}
          >
            <option value="0">Any Length</option>
            <option value="3">&ge; 3 Letters</option>
            <option value="4">&ge; 4 Letters</option>
            <option value="5">&ge; 5 Letters</option>
          </FilterSelect>

          <FilterSelect label="Flesch Ease" value={minFlesch} setter={updateFilter(setMinFlesch)}>
            <option value="0">Any Difficulty</option>
            <option value="50">&ge; 50 (Fair)</option>
            <option value="70">&ge; 70 (Easy)</option>
            <option value="80">&ge; 80 (Very Easy)</option>
            <option value="90">&ge; 90 (Pre-K/Kinder)</option>
          </FilterSelect>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 px-2">
        <p className="text-slate-500">
          Showing{' '}
          <span className="font-bold text-emerald-600">
            {totalBooks > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + PAGE_SIZE, totalBooks)}
          </span>{' '}
          of <span className="font-bold">{totalBooks.toLocaleString()}</span> books
        </p>
      </div>

      <BadgeLegend />

      {loading ? (
        <div className="text-slate-800 text-center py-24 text-2xl font-bold animate-pulse">
          Searching Library...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.length > 0 ? (
            books.map((book) => <BookCard key={book.id} {...book} libraryStats={libraryStats} />)
          ) : (
            <div className="col-span-full text-center py-12 text-slate-500">
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
            className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl disabled:opacity-50 font-bold hover:bg-slate-50 transition"
          >
            Previous
          </button>
          <span className="text-slate-500 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => {
              setCurrentPage(currentPage + 1);
              window.scrollTo(0, 0);
            }}
            disabled={currentPage === totalPages}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl disabled:opacity-50 font-bold hover:bg-emerald-700 transition"
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
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => setter(e.target.value)}
        className="bg-white border border-slate-300 text-slate-700 text-sm rounded-xl px-3 py-2.5 focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer shadow-sm"
      >
        {children}
      </select>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 animate-pulse font-bold text-slate-400">
          Loading search engine...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
