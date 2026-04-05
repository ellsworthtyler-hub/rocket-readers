// app/search/page.tsx
'use client';
import { useState, useEffect } from "react";
import { loadBooks } from "@/lib/data";
import { BookCard } from "@/components/BookCard";
import { Book } from "@/lib/data";

export default function SearchPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [minDolch, setMinDolch] = useState("0");
  const [minFry, setMinFry] = useState("0");
  const [maxFlesch, setMaxFlesch] = useState("12");
  const [minDialog, setMinDialog] = useState("0");

  useEffect(() => {
    loadBooks().then(setBooks);
  }, []);

  // Normalize book values (some are decimals like 0.975, some may be percentages)
  const normalize = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : (num > 1 ? num : num * 100);
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDolch = normalize(book.dolchBreadth) >= parseFloat(minDolch);
    const matchesFry = normalize(book.frySight) >= parseFloat(minFry);
    const matchesFlesch = parseFloat(book.fleschGrade) <= parseFloat(maxFlesch);
    const matchesDialog = normalize(book.dialogRatio) >= parseFloat(minDialog);

    return matchesSearch && matchesDolch && matchesFry && matchesFlesch && matchesDialog;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Search Library</h1>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-white/20 rounded-3xl px-5 py-4 text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Min Dolch %</label>
          <select
            value={minDolch}
            onChange={(e) => setMinDolch(e.target.value)}
            className="w-full bg-slate-900 border border-white/20 rounded-3xl px-5 py-4 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="0">Any</option>
            <option value="50">50%+</option>
            <option value="70">70%+</option>
            <option value="90">90%+</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Min Fry %</label>
          <select
            value={minFry}
            onChange={(e) => setMinFry(e.target.value)}
            className="w-full bg-slate-900 border border-white/20 rounded-3xl px-5 py-4 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="0">Any</option>
            <option value="50">50%+</option>
            <option value="70">70%+</option>
            <option value="90">90%+</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Max Flesch Grade</label>
          <select
            value={maxFlesch}
            onChange={(e) => setMaxFlesch(e.target.value)}
            className="w-full bg-slate-900 border border-white/20 rounded-3xl px-5 py-4 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="12">Any</option>
            <option value="3">≤ Grade 3</option>
            <option value="5">≤ Grade 5</option>
            <option value="7">≤ Grade 7</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Min Dialogue %</label>
          <select
            value={minDialog}
            onChange={(e) => setMinDialog(e.target.value)}
            className="w-full bg-slate-900 border border-white/20 rounded-3xl px-5 py-4 text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="0">Any</option>
            <option value="40">40%+</option>
            <option value="60">60%+</option>
            <option value="80">80%+</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-slate-400 mb-6">
        Showing {filteredBooks.length} of {books.length} books
      </p>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              author={book.author}
              dolch={book.dolchBreadth}
              fry={book.frySight}
            />
          ))
        ) : (
          <p className="text-slate-400 col-span-3 text-center py-12">No books match your filters.</p>
        )}
      </div>
    </div>
  );
}
