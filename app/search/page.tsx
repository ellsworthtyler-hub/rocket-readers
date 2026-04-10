// app/search/page.tsx
'use client';

import { useState, useEffect, useMemo } from "react";
import { BookCard } from "@/components/BookCard";
import { loadBooks } from "@/lib/data";
import type { Book } from "@/lib/data";

const PAGE_SIZE = 100;

export default function SearchPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [minDolch, setMinDolch] = useState("0");
  const [minFry, setMinFry] = useState("0");
  const [maxFlesch, setMaxFlesch] = useState("12");
  const [minDialog, setMinDialog] = useState("0");

  // Load all books once (cached on server)
  useEffect(() => {
    loadBooks().then((loaded) => {
      setBooks(loaded);
      setFilteredBooks(loaded);
      setCurrentPage(1); // reset to page 1 when data loads
    });
  }, []);

  // Re-filter when any filter changes
  useEffect(() => {
    const filtered = books.filter((book) => {
      const matchesSearch = 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.author || "").toLowerCase().includes(searchTerm.toLowerCase());

      const dolchNum = parseFloat(book.dolch) || 0;
      const fryNum = parseFloat(book.fry) || 0;
      const fleschNum = parseFloat(book.fleschGrade) || 12;
      const dialogNum = parseFloat(book.dialogRatio) || 0;

      return (
        matchesSearch &&
        dolchNum >= parseFloat(minDolch) &&
        fryNum >= parseFloat(minFry) &&
        fleschNum <= parseFloat(maxFlesch) &&
        dialogNum >= parseFloat(minDialog)
      );
    });
    setFilteredBooks(filtered);
    setCurrentPage(1); // reset to first page when filters change
  }, [searchTerm, minDolch, minFry, maxFlesch, minDialog, books]);

  // Paginate the filtered results
  const totalFiltered = filteredBooks.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedBooks = filteredBooks.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-bold text-center mb-10">Search Library</h1>

      {/* Search bar + filters (unchanged) */}
      <div className="max-w-2xl mx-auto mb-8">
        <input
          type="text"
          placeholder="Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-white/20 focus:border-emerald-400 rounded-3xl px-6 py-4 text-lg placeholder:text-slate-400 text-white focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {/* (your existing filter selects stay exactly the same) */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 text-center">Min Dolch %</label>
          <select value={minDolch} onChange={(e) => setMinDolch(e.target.value)} className="bg-slate-900 border border-white/20 rounded-3xl px-6 py-3 text-white focus:border-emerald-400 focus:outline-none">
            <option value="0">Any</option>
            <option value="70">70%</option>
            <option value="80">80%</option>
            <option value="90">90%</option>
          </select>
        </div>
        {/* Repeat for Min Fry, Max Flesch, Min Dialogue — exactly as before */}
        {/* ... (copy your existing four selects here) ... */}
      </div>

      {/* Results header + pagination info */}
      <div className="flex items-center justify-between mb-6 px-2">
        <p className="text-slate-400">
          Showing <span className="font-semibold text-emerald-700">{startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, totalFiltered)}</span> of <span className="font-semibold">{totalFiltered.toLocaleString()}</span> books
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-5 py-2 bg-white border border-slate-200 hover:border-emerald-300 disabled:opacity-40 rounded-2xl font-medium transition"
          >
            ← Previous
          </button>
          <span className="font-medium text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-5 py-2 bg-white border border-slate-200 hover:border-emerald-300 disabled:opacity-40 rounded-2xl font-medium transition"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Book cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedBooks.map((book) => (
          <BookCard
            key={book.id}
            id={book.id}
            title={book.title}
            author={book.author}
            dolch={book.dolch}
            fry={book.fry}
            dialogRatio={book.dialogRatio}
            fleschGrade={book.fleschGrade}
          />
        ))}
      </div>

      {/* Bottom pagination (for long lists) */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-12">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-6 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl">← Previous Page</button>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-6 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl">Next Page →</button>
        </div>
      )}
    </div>
  );
}