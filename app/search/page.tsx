//  FILE:  app/search/page.tsx
//  ===========================

'use client';

import { useState, useEffect } from "react";
import { BookCard } from "@/components/BookCard";
import { supabase } from "@/lib/supabaseClient"; // Use live database

// 1. Define the Book type locally to fix the build error
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

export default function SearchPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [minDolch, setMinDolch] = useState("0");
  const [minFry, setMinFry] = useState("0");
  const [minFlesch, setMinFlesch] = useState("0"); 
  const [minDialog, setMinDialog] = useState("0");

  const fetchBooks = async () => {
  setLoading(true);
  
  // 1. Explicitly name the relationship using the '!' syntax
  const { data, error } = await supabase
    .from('book_metadata')
    .select('*, gutenberg_catalog!fk_book_catalog(title, author)') 
    .limit(100);

  if (error) {
    console.error("❌ Supabase fetch error:", error);
    setLoading(false);
    return;
  }

  const formatted: Book[] = (data || []).map((b: any) => {
    // 2. DEFENSIVE MAPPING: Check if it's an array or an object
    const catalog = Array.isArray(b.gutenberg_catalog) 
      ? b.gutenberg_catalog[0] 
      : b.gutenberg_catalog;

    return {
      id: b.book_id.toString(),
      // 3. Fallback chain: Catalog Title -> Metadata Placeholder -> ID
      title: catalog?.title || b.title || `Book ${b.book_id}`,
      author: catalog?.author || b.author || "Unknown Author",
      dolch: b.dolch_percentage?.toString() || "0",
      fry: b.fry_percentage?.toString() || "0",
      fleschGrade: b.flesch_reading_ease?.toString() || "0",
      dialogRatio: b.dialog_percentage?.toString() || "0"
    };
  });

  setBooks(formatted);
  setFilteredBooks(formatted);
  setLoading(false);
};

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    const filtered = books.filter((book) => {
      const matchesSearch = 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.author || "").toLowerCase().includes(searchTerm.toLowerCase());

      const dolchNum = parseFloat(book.dolch) || 0;
      const fryNum = parseFloat(book.fry) || 0;
      const fleschNum = parseFloat(book.fleschGrade) || 0;
      const dialogNum = parseFloat(book.dialogRatio) || 0;

      return (
        matchesSearch &&
        dolchNum >= parseFloat(minDolch) &&
        fryNum >= parseFloat(minFry) &&
        fleschNum >= parseFloat(minFlesch) && 
        dialogNum >= parseFloat(minDialog)
      );
    });
    setFilteredBooks(filtered);
    setCurrentPage(1);
  }, [searchTerm, minDolch, minFry, minFlesch, minDialog, books]);

  const totalFiltered = filteredBooks.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedBooks = filteredBooks.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <div className="text-white text-center py-20 text-xl">Loading Library...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-bold text-center mb-10 text-white">Search Library</h1>

      {/* Search Input */}
      <div className="max-w-2xl mx-auto mb-8">
        <input
          type="text"
          placeholder="Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-400 rounded-3xl px-6 py-4 text-lg placeholder:text-slate-400 text-white focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <div>
          <label className="block text-xs text-slate-400 mb-1 text-center">Min Dolch %</label>
          <select value={minDolch} onChange={(e) => setMinDolch(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-3xl px-6 py-3 text-white focus:border-emerald-400 focus:outline-none">
            <option value="0">Any</option>
            <option value="70">70%</option>
            <option value="80">80%</option>
            <option value="90">90%</option>
          </select>
        </div>
        {/* (Rest of your UI stays the same...) */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 text-center">Min Fry %</label>
          <select value={minFry} onChange={(e) => setMinFry(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-3xl px-6 py-3 text-white focus:border-emerald-400 focus:outline-none">
            <option value="0">Any</option>
            <option value="70">70%</option>
            <option value="80">80%</option>
            <option value="90">90%</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 text-center">Min Flesch Ease</label>
          <select value={minFlesch} onChange={(e) => setMinFlesch(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-3xl px-6 py-3 text-white focus:border-emerald-400 focus:outline-none">
            <option value="0">Any</option>
            <option value="50">≥ 50 (Fair)</option>
            <option value="70">≥ 70 (Easy)</option>
            <option value="80">≥ 80 (Very Easy)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 text-center">Min Dialogue %</label>
          <select value={minDialog} onChange={(e) => setMinDialog(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-3xl px-6 py-3 text-white focus:border-emerald-400 focus:outline-none">
            <option value="0">Any</option>
            <option value="40">40%</option>
            <option value="50">50%</option>
            <option value="60">60%</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 px-2">
        <p className="text-slate-400">
          Showing <span className="font-semibold text-emerald-400">{startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, totalFiltered)}</span> of <span className="font-semibold">{totalFiltered.toLocaleString()}</span> books
        </p>
        <button onClick={fetchBooks} className="px-4 py-2 text-sm bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 rounded-2xl font-medium border border-emerald-800 transition">
          🔄 Force Refresh Library
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedBooks.map((book) => (
          <BookCard key={book.id} {...book} />
        ))}
      </div>
      
      {/* Basic Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-12">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-6 py-2 bg-slate-800 text-white rounded-xl disabled:opacity-50">Prev</button>
          <span className="text-slate-400 py-2">Page {currentPage} of {totalPages}</span>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-6 py-2 bg-slate-800 text-white rounded-xl disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}