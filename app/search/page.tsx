// app/search/page.tsx
'use client';

import { useState, useEffect } from "react";
import { BookCard } from "@/components/BookCard";
import { loadBooks } from "@/lib/data";
import type { Book } from "@/lib/data";

export default function SearchPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [minDolch, setMinDolch] = useState("0");
  const [minFry, setMinFry] = useState("0");
  const [maxFlesch, setMaxFlesch] = useState("12");
  const [minDialog, setMinDialog] = useState("0");

  useEffect(() => {
    loadBooks().then((loaded) => {
      setBooks(loaded);
      setFilteredBooks(loaded);
    });
  }, []);

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
  }, [searchTerm, minDolch, minFry, maxFlesch, minDialog, books]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-bold text-center mb-10">Search Library</h1>

      {/* Centered search bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <input
          type="text"
          placeholder="Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-white/20 focus:border-emerald-400 rounded-3xl px-6 py-4 text-lg placeholder:text-slate-400 text-white focus:outline-none"
        />
      </div>

      {/* Centered dropdown filters */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <div>
          <label className="block text-xs text-slate-400 mb-1 text-center">Min Dolch %</label>
          <select
            value={minDolch}
            onChange={(e) => setMinDolch(e.target.value)}
            className="bg-slate-900 border border-white/20 rounded-3xl px-6 py-3 text-white focus:border-emerald-400 focus:outline-none"
          >
            <option value="0">Any</option>
            <option value="70">70%</option>
            <option value="80">80%</option>
            <option value="90">90%</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1 text-center">Min Fry %</label>
          <select
            value={minFry}
            onChange={(e) => setMinFry(e.target.value)}
            className="bg-slate-900 border border-white/20 rounded-3xl px-6 py-3 text-white focus:border-emerald-400 focus:outline-none"
          >
            <option value="0">Any</option>
            <option value="70">70%</option>
            <option value="80">80%</option>
            <option value="90">90%</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1 text-center">Max Flesch Grade</label>
          <select
            value={maxFlesch}
            onChange={(e) => setMaxFlesch(e.target.value)}
            className="bg-slate-900 border border-white/20 rounded-3xl px-6 py-3 text-white focus:border-emerald-400 focus:outline-none"
          >
            <option value="12">Any</option>
            <option value="6">≤ 6th</option>
            <option value="4">≤ 4th</option>
            <option value="2">≤ 2nd</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1 text-center">Min Dialogue %</label>
          <select
            value={minDialog}
            onChange={(e) => setMinDialog(e.target.value)}
            className="bg-slate-900 border border-white/20 rounded-3xl px-6 py-3 text-white focus:border-emerald-400 focus:outline-none"
          >
            <option value="0">Any</option>
            <option value="40">40%</option>
            <option value="50">50%</option>
            <option value="60">60%</option>
          </select>
        </div>
      </div>

      <p className="text-slate-400 text-center mb-6">
        Showing {filteredBooks.length} of {books.length} books
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBooks.map((book) => (
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
    </div>
  );
}
