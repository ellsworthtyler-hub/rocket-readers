'use client';

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const PAGE_SIZE = 40;

const COLUMNS = `
  source_id,
  title,
  author,
  count_nouns,
  count_verbs,
  count_adjectives,
  count_adverbs,
  count_prepositions,
  pos_total
`;

type SortKey = "noun_pct" | "verb_pct" | "adj_pct" | "adv_pct" | "prep_pct";

type Part = {
  key: SortKey;
  label: string;
  countKey: "nouns" | "verbs" | "adjectives" | "adverbs" | "prepositions";
  bar: string;
  dot: string;
  active: string;
  idle: string;
  percent: string;
};

const PARTS: Part[] = [
  { key: "noun_pct", label: "Nouns", countKey: "nouns", bar: "bg-indigo-500", dot: "bg-indigo-500", active: "bg-indigo-500 text-white border-indigo-400", idle: "bg-slate-900 text-indigo-200 border-indigo-500/70", percent: "text-indigo-300" },
  { key: "verb_pct", label: "Verbs", countKey: "verbs", bar: "bg-rose-500", dot: "bg-rose-500", active: "bg-rose-500 text-white border-rose-400", idle: "bg-slate-900 text-rose-200 border-rose-500/70", percent: "text-rose-300" },
  { key: "adj_pct", label: "Adjectives", countKey: "adjectives", bar: "bg-amber-500", dot: "bg-amber-500", active: "bg-amber-500 text-slate-950 border-amber-300", idle: "bg-slate-900 text-amber-200 border-amber-500/70", percent: "text-amber-300" },
  { key: "adv_pct", label: "Adverbs", countKey: "adverbs", bar: "bg-sky-500", dot: "bg-sky-500", active: "bg-sky-500 text-slate-950 border-sky-300", idle: "bg-slate-900 text-sky-200 border-sky-500/70", percent: "text-sky-300" },
  { key: "prep_pct", label: "Prepositions", countKey: "prepositions", bar: "bg-emerald-500", dot: "bg-emerald-500", active: "bg-emerald-500 text-white border-emerald-300", idle: "bg-slate-900 text-emerald-200 border-emerald-500/70", percent: "text-emerald-300" },
];

type PosBook = {
  sourceId: string;
  title: string;
  author: string;
  nouns: number;
  verbs: number;
  adjectives: number;
  adverbs: number;
  prepositions: number;
};

type PosRow = {
  source_id: string;
  title: string | null;
  author: string | null;
  count_nouns: number | null;
  count_verbs: number | null;
  count_adjectives: number | null;
  count_adverbs: number | null;
  count_prepositions: number | null;
};

function likePattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

function mapRow(row: PosRow): PosBook {
  return {
    sourceId: String(row.source_id),
    title: row.title?.trim() || "Untitled",
    author: row.author?.trim() || "Unknown Author",
    nouns: row.count_nouns || 0,
    verbs: row.count_verbs || 0,
    adjectives: row.count_adjectives || 0,
    adverbs: row.count_adverbs || 0,
    prepositions: row.count_prepositions || 0,
  };
}

function share(count: number, total: number): number {
  if (total <= 0) return 0;
  return (count / total) * 100;
}

function GrammarBar({ book }: { book: PosBook }) {
  const total = book.nouns + book.verbs + book.adjectives + book.adverbs + book.prepositions;
  const label = PARTS.map((part) => {
    const count = book[part.countKey];
    return `${part.label} ${share(count, total).toFixed(1)}%`;
  }).join(", ");

  if (total <= 0) {
    return <div className="h-8 w-full rounded-full bg-slate-800" title="No grammar counts" role="img" aria-label="No grammar counts" />;
  }

  return (
    <div className="h-8 w-full flex rounded-full overflow-hidden" role="img" aria-label={label}>
      {PARTS.map((part) => {
        const count = book[part.countKey];
        return (
          <div
            key={part.key}
            style={{ width: `${share(count, total)}%` }}
            className={`${part.bar} h-full`}
            title={`${part.label}: ${count.toLocaleString()} (${share(count, total).toFixed(1)}%)`}
          />
        );
      })}
    </div>
  );
}

export default function PartsOfSpeechPage() {
  const [titleInput, setTitleInput] = useState("");
  const [authorInput, setAuthorInput] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("noun_pct");
  const [ascending, setAscending] = useState(false);
  const [books, setBooks] = useState<PosBook[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  const requestGen = useRef(0);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<() => void>(() => {});

  useEffect(() => {
    const timer = setTimeout(() => setTitle(titleInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [titleInput]);

  useEffect(() => {
    const timer = setTimeout(() => setAuthor(authorInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [authorInput]);

  useEffect(() => {
    const gen = ++requestGen.current;
    loadingMoreRef.current = false;
    setLoading(true);
    setLoadingMore(false);
    setError("");

    let query = supabase
      .from("rr_book_pos_search")
      .select(COLUMNS, { count: "exact" })
      .order(sortKey, { ascending, nullsFirst: false })
      .order("source_id", { ascending: true });
    if (title) query = query.ilike("title", likePattern(title));
    if (author) query = query.ilike("author", likePattern(author));

    (async () => {
      try {
        const { data, count, error: queryError } = await query.range(0, PAGE_SIZE - 1);
        if (gen !== requestGen.current) return;
        if (queryError) {
          setError(queryError.message);
          setBooks([]);
          setTotal(0);
          setHasMore(false);
        } else {
          const rows = (data || []).map((row) => mapRow(row as PosRow));
          setBooks(rows);
          setTotal(count || 0);
          setHasMore(rows.length === PAGE_SIZE);
        }
      } catch (err) {
        if (gen !== requestGen.current) return;
        setError(err instanceof Error ? err.message : "Search failed");
        setBooks([]);
        setTotal(0);
        setHasMore(false);
      }
      if (gen === requestGen.current) setLoading(false);
    })();
  }, [title, author, sortKey, ascending]);

  loadMoreRef.current = () => {
    if (loadingMoreRef.current || loading || !hasMore) return;
    const gen = requestGen.current;
    const from = books.length;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    let query = supabase
      .from("rr_book_pos_search")
      .select(COLUMNS)
      .order(sortKey, { ascending, nullsFirst: false })
      .order("source_id", { ascending: true });
    if (title) query = query.ilike("title", likePattern(title));
    if (author) query = query.ilike("author", likePattern(author));

    (async () => {
      try {
        const { data, error: queryError } = await query.range(from, from + PAGE_SIZE - 1);
        if (gen !== requestGen.current) return;
        if (queryError) {
          setError(queryError.message);
          setHasMore(false);
          return;
        }
        const rows = (data || []).map((row) => mapRow(row as PosRow));
        setBooks((prev) => [...prev, ...rows]);
        setHasMore(rows.length === PAGE_SIZE);
      } catch (err) {
        if (gen !== requestGen.current) return;
        setError(err instanceof Error ? err.message : "Search failed");
        setHasMore(false);
      } finally {
        if (gen !== requestGen.current) return;
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    })();
  };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMoreRef.current();
    }, { rootMargin: "480px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, books.length, loading]);

  const activePart = PARTS.find((part) => part.key === sortKey) || PARTS[0];

  const chooseSort = (key: SortKey) => {
    if (key === sortKey) setAscending((current) => !current);
    else {
      setSortKey(key);
      setAscending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-20">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-3 text-white">Search by Part of Speech</h1>
      <p className="text-center text-slate-400 mb-10 font-bold max-w-3xl mx-auto">
        Sort the library by how much of each book is nouns, verbs, adjectives, adverbs, or prepositions.
      </p>

      <div className="max-w-4xl mx-auto mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Filter by title..."
          value={titleInput}
          onChange={(event) => setTitleInput(event.target.value)}
          aria-label="Filter by title"
          className="w-full bg-slate-900 border-2 border-slate-600 focus:border-emerald-400 rounded-2xl px-6 py-4 text-lg text-white focus:outline-none"
        />
        <input
          type="text"
          placeholder="Filter by author..."
          value={authorInput}
          onChange={(event) => setAuthorInput(event.target.value)}
          aria-label="Filter by author"
          className="w-full bg-slate-900 border-2 border-slate-600 focus:border-emerald-400 rounded-2xl px-6 py-4 text-lg text-white focus:outline-none"
        />
      </div>

      <div className="bg-slate-900/80 rounded-3xl p-6 mb-6 border border-slate-700">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-white">Sort by part of speech</h2>
          <button
            type="button"
            onClick={() => {
              setTitleInput("");
              setAuthorInput("");
              setTitle("");
              setAuthor("");
              setSortKey("noun_pct");
              setAscending(false);
            }}
            className="text-xs text-red-400 hover:underline font-bold"
          >
            Clear filters
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PARTS.map((part) => {
            const selected = part.key === sortKey;
            const arrow = selected ? (ascending ? "↑" : "↓") : "";
            return (
              <button
                key={part.key}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseSort(part.key)}
                className={`rounded-full border-2 px-4 py-2 text-sm font-bold ${selected ? part.active : part.idle}`}
              >
                <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle ${part.dot}`} />
                {part.label} {arrow}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Highest share first. Select the same part again to flip the order. The number beside each bar is that book&apos;s share of {activePart.label.toLowerCase()}.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm mb-4 px-1">
        {PARTS.map((part) => (
          <div key={part.key} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${part.dot}`} />
            <span className="text-slate-300">{part.label}</span>
          </div>
        ))}
      </div>

      <p className="text-slate-300 mb-4 px-1">
        {loading ? "Searching the library..." : (
          <>
            <span className="font-bold text-emerald-300">{books.length.toLocaleString()}</span>
            {" of "}
            <span className="font-bold">{total.toLocaleString()}</span>
            {" books"}
          </>
        )}
      </p>

      {error ? (
        <div className="text-center py-12 text-rose-300 font-bold">{error}</div>
      ) : loading ? (
        <div className="text-white text-center py-24 text-2xl font-bold animate-pulse">Searching the library...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No books found matching these filters.</div>
      ) : (
        <div className="rounded-3xl border border-slate-700 bg-slate-900/60">
          <div className="hidden md:grid md:grid-cols-[minmax(14rem,1.5fr)_minmax(9rem,1fr)_minmax(14rem,1.5fr)_4.5rem] gap-4 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700">
            <span>Title</span>
            <span>Author</span>
            <span>Grammatical breakdown</span>
            <span className="text-right">{activePart.label}</span>
          </div>
          <ul>
            {books.map((book) => {
              const totalPos = book.nouns + book.verbs + book.adjectives + book.adverbs + book.prepositions;
              const activePct = share(book[activePart.countKey], totalPos);
              return (
                <li key={book.sourceId} className="border-b border-slate-800 last:border-b-0 [content-visibility:auto] [contain-intrinsic-size:auto_4.5rem]">
                  <div className="grid grid-cols-1 gap-2 px-4 py-3 hover:bg-slate-800/70 md:grid-cols-[minmax(14rem,1.5fr)_minmax(9rem,1fr)_minmax(14rem,1.5fr)_4.5rem] md:items-center md:gap-4">
                    <Link href={`/book/${book.sourceId}`} className="font-bold text-white hover:text-emerald-300 md:truncate" title={book.title}>
                      {book.title}
                    </Link>
                    <span className="text-slate-300 md:truncate" title={book.author}>{book.author}</span>
                    <div className="flex items-center gap-3 md:contents">
                      <GrammarBar book={book} />
                      <span className={`w-16 shrink-0 text-right font-bold tabular-nums ${activePart.percent}`}>
                        {totalPos > 0 ? `${activePct.toFixed(1)}%` : "—"}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div ref={sentinelRef} className="h-8" />
      {loadingMore && <p className="text-center text-slate-400 font-bold py-4">Loading more books...</p>}
      {!loading && !hasMore && books.length > 0 && (
        <p className="text-center text-slate-500 text-sm py-4">End of the list.</p>
      )}
    </div>
  );
}
