'use client';

import { useEffect, useState, Suspense, type Dispatch, type ReactNode, type SetStateAction } from "react";
import Link from "next/link";
import { BookCard } from "@/components/BookCard";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import { BadgeLegend } from "@/components/BadgeLegend";

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

const THEMES = [
  "Literature",
  "History",
  "Science & Technology",
  "Arts & Culture",
  "Lifestyle & Hobbies",
  "Religion & Philosophy",
  "Education & Reference",
  "Social Sciences & Society",
  "Health & Medicine",
  "Uncategorized",
];

const THEME_ALIASES: Record<string, string> = {
  Science: "Science & Technology",
  Technology: "Science & Technology",
  Arts: "Arts & Culture",
  Culture: "Arts & Culture",
  Religion: "Religion & Philosophy",
  Philosophy: "Religion & Philosophy",
  Education: "Education & Reference",
  Reference: "Education & Reference",
  Society: "Social Sciences & Society",
  Health: "Health & Medicine",
  Medicine: "Health & Medicine",
  Lifestyle: "Lifestyle & Hobbies",
  Hobbies: "Lifestyle & Hobbies",
};

function canonicalTheme(value: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (THEME_ALIASES[trimmed]) return THEME_ALIASES[trimmed];
  if (THEMES.includes(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  return THEMES.find((theme) => theme.toLowerCase() === lower)
    || THEMES.find((theme) => theme.toLowerCase().includes(lower) || lower.includes(theme.toLowerCase()))
    || trimmed;
}

const BOOK_COLUMNS = `
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
  const themeFromUrl = canonicalTheme(searchParams.get("theme") || "");

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [libraryStats, setLibraryStats] = useState<unknown>(null);
  const [themeOptions, setThemeOptions] = useState<{ theme: string; count: number }[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [theme, setTheme] = useState(themeFromUrl);
  const [minDolch, setMinDolch] = useState("0");
  const [minFry, setMinFry] = useState("0");
  const [minDialog, setMinDialog] = useState("0");
  const [minFlesch, setMinFlesch] = useState("0");
  const [variability, setVariability] = useState("0");
  const [sentenceTier, setSentenceTier] = useState("0");
  const [wordTier, setWordTier] = useState("0");
  const [wordLength, setWordLength] = useState("0");
  const [sortBy, setSortBy] = useState("dolch_percentage");

  const updateFilter = (setter: Dispatch<SetStateAction<string>>) => (val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleTextSearch = () => {
    setActiveSearch(searchInput);
    setCurrentPage(1);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found: { theme: string; count: number }[] = [];
      for (const name of THEMES) {
        const { count, error } = await supabase
          .from("rr_book_metadata")
          .select("book_id, rr_book!inner(theme)", { count: "exact", head: true })
          .not("last_processed", "is", null)
          .eq("rr_book.theme", name);
        if (error) {
          console.warn("theme count failed for", name, error.message);
          continue;
        }
        if ((count || 0) > 0) found.push({ theme: name, count: count || 0 });
      }
      found.sort((a, b) => b.count - a.count);
      if (!cancelled) setThemeOptions(found);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setTheme(themeFromUrl);
  }, [themeFromUrl]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: statsData } = await supabase.from("library_percentiles").select("*").maybeSingle();
      if (statsData) setLibraryStats(statsData);

      let query = supabase
        .from("rr_book_metadata")
        .select(BOOK_COLUMNS, { count: "exact" })
        .not("last_processed", "is", null);

      if (minDolch !== "0") query = query.gte("dolch_percentage", parseFloat(minDolch));
      if (minFry !== "0") query = query.gte("fry_percentage", parseFloat(minFry));
      if (minFlesch !== "0") query = query.gte("flesch_reading_ease", parseFloat(minFlesch));
      if (minDialog !== "0") query = query.gte("dialog_percentage", parseFloat(minDialog));
      if (variability !== "0") query = query.gte("word_variability_ratio", parseFloat(variability));
      if (wordLength !== "0") query = query.gte("avg_word_length", parseFloat(wordLength));
      if (sentenceTier !== "0") {
        query = sentenceTier === "over_5000"
          ? query.gte("total_sentences", 5000)
          : query.lte("total_sentences", parseInt(sentenceTier, 10));
      }
      if (wordTier !== "0") {
        query = wordTier === "over_30000"
          ? query.gte("total_words", 30000)
          : query.lte("total_words", parseInt(wordTier, 10));
      }

      const selectedTheme = canonicalTheme(theme);
      if (selectedTheme) query = query.eq("rr_book.theme", selectedTheme);
      if (activeSearch) query = query.ilike("rr_book.title", `%${activeSearch}%`);

      query = sortBy === "flesch_grade" || sortBy === "flesch_reading_ease"
        ? query.order("flesch_grade", { ascending: true, nullsFirst: false })
        : query.order(sortBy, { ascending: false, nullsFirst: false });

      const from = (currentPage - 1) * PAGE_SIZE;
      const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
      if (error) {
        console.error("Search query failed:", error.message);
        setBooks([]);
        setTotalBooks(0);
        setLoading(false);
        return;
      }

      setBooks((data || []).map((row) => {
        const joined = Array.isArray(row.rr_book) ? row.rr_book[0] : row.rr_book;
        return {
          id: String(joined?.source_id ?? row.book_id),
          title: joined?.title || `Book ${row.book_id}`,
          author: joined?.author || "Unknown Author",
          dolch: row.dolch_percentage?.toString() || "0",
          fry: row.fry_percentage?.toString() || "0",
          fleschGrade: row.flesch_grade?.toString() || "0",
          dialogRatio: row.dialog_percentage?.toString() || "0",
        };
      }));
      setTotalBooks(count || 0);
      setLoading(false);
    })();
  }, [activeSearch, theme, minDolch, minFry, minFlesch, minDialog, variability, sentenceTier, wordTier, wordLength, sortBy, currentPage]);

  const totalPages = Math.ceil(totalBooks / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-20">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-3 text-white">Search the Archive</h1>
      <p className="text-center text-slate-400 mb-3 font-bold">Target books with sight-word density, dialogue, length, and theme.</p>
      <p className="text-center mb-10">
        <Link href="/parts-of-speech" className="text-emerald-300 font-bold hover:underline">Search by part of speech</Link>
      </p>

      <div className="max-w-3xl mx-auto mb-8 flex gap-3 flex-wrap sm:flex-nowrap">
        <input
          type="text"
          placeholder="Search by Title..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") handleTextSearch(); }}
          className="w-full bg-slate-900 border-2 border-slate-600 focus:border-emerald-400 rounded-2xl px-6 py-4 text-lg text-white focus:outline-none"
        />
        <button
          type="button"
          onClick={handleTextSearch}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 rounded-2xl shrink-0"
        >
          Search
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-3xl p-6 mb-12 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Mission filters</h3>
          <button
            type="button"
            onClick={() => {
              setTheme("");
              setMinDolch("0");
              setMinFry("0");
              setMinDialog("0");
              setMinFlesch("0");
              setVariability("0");
              setSentenceTier("0");
              setWordTier("0");
              setWordLength("0");
              setSearchInput("");
              setActiveSearch("");
              setCurrentPage(1);
              setSortBy("dolch_percentage");
            }}
            className="text-xs text-red-400 hover:underline font-bold"
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
            {themeOptions.map((option) => (
              <option key={option.theme} value={option.theme}>{option.theme} ({option.count})</option>
            ))}
          </FilterSelect>

          <PercentFilter label="Min Dolch %" value={minDolch} setter={updateFilter(setMinDolch)} />
          <PercentFilter label="Min Fry %" value={minFry} setter={updateFilter(setMinFry)} />

          <FilterSelect label="Dialogue %" value={minDialog} setter={updateFilter(setMinDialog)}>
            <option value="0">Any %</option>
            <option value="10">10%+</option>
            <option value="20">20%+</option>
            <option value="30">30%+</option>
            <option value="40">40%+</option>
            <option value="50">50%+</option>
          </FilterSelect>

          <FilterSelect label="Length (Sentences)" value={sentenceTier} setter={updateFilter(setSentenceTier)}>
            <option value="0">Any Length</option>
            <option value="100">≤ 100 Sentences</option>
            <option value="500">≤ 500 Sentences</option>
            <option value="1500">≤ 1500 Sentences</option>
            <option value="5000">≤ 5000 Sentences</option>
            <option value="over_5000">&gt; 5000 Sentences</option>
          </FilterSelect>

          <FilterSelect label="Length (Words)" value={wordTier} setter={updateFilter(setWordTier)}>
            <option value="0">Any Length</option>
            <option value="500">≤ 500 Words</option>
            <option value="2000">≤ 2,000 Words</option>
            <option value="10000">≤ 10,000 Words</option>
            <option value="30000">≤ 30,000 Words</option>
            <option value="over_30000">&gt; 30,000 Words</option>
          </FilterSelect>

          <FilterSelect label="Lexical Variety" value={variability} setter={updateFilter(setVariability)}>
            <option value="0">Any Ratio</option>
            <option value="0.1">≥ 10% Unique</option>
            <option value="0.2">≥ 20% Unique</option>
            <option value="0.3">≥ 30% Unique</option>
            <option value="0.4">≥ 40% Unique</option>
          </FilterSelect>

          <FilterSelect label="Avg Word Length" value={wordLength} setter={updateFilter(setWordLength)}>
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
        <p className="text-slate-300">
          Showing <span className="font-bold text-emerald-300">{totalBooks > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + PAGE_SIZE, totalBooks)}</span> of <span className="font-bold">{totalBooks.toLocaleString()}</span> books
        </p>
      </div>

      <BadgeLegend />

      {loading ? (
        <div className="text-white text-center py-24 text-2xl font-bold animate-pulse">Searching the library...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.length > 0 ? (
            books.map((book) => <BookCard key={book.id} {...book} libraryStats={libraryStats} />)
          ) : (
            <div className="col-span-full text-center py-12 text-slate-400">
              No books found matching these filters. Try adjusting your search!
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-16">
          <button type="button" onClick={() => { setCurrentPage(currentPage - 1); window.scrollTo(0, 0); }} disabled={currentPage === 1} className="px-6 py-3 bg-slate-800 border-2 border-slate-600 text-white rounded-xl disabled:opacity-50 font-bold">Previous</button>
          <span className="text-slate-300 font-medium">Page {currentPage} of {totalPages}</span>
          <button type="button" onClick={() => { setCurrentPage(currentPage + 1); window.scrollTo(0, 0); }} disabled={currentPage === totalPages} className="px-6 py-3 bg-emerald-600 text-white rounded-xl disabled:opacity-50 font-bold">Next</button>
        </div>
      )}
    </div>
  );
}

function PercentFilter({ label, value, setter }: { label: string; value: string; setter: (val: string) => void }) {
  return (
    <FilterSelect label={label} value={value} setter={setter}>
      <option value="0">Any %</option>
      <option value="20">20%+</option>
      <option value="30">30%+</option>
      <option value="40">40%+</option>
      <option value="50">50%+</option>
      <option value="60">60%+</option>
      <option value="70">70%+</option>
      <option value="80">80%+</option>
    </FilterSelect>
  );
}

function FilterSelect({ label, value, setter, children }: { label: string; value: string; setter: (val: string) => void; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">{label}</label>
      <select
        value={value}
        onChange={(event) => setter(event.target.value)}
        className="bg-slate-950 border border-slate-600 text-slate-100 text-sm rounded-xl px-3 py-2.5 focus:border-emerald-400 focus:outline-none cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 animate-pulse font-bold text-slate-300">Loading search engine...</div>}>
      <SearchContent />
    </Suspense>
  );
}
