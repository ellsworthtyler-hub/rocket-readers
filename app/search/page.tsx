// app/search/page.tsx
'use client';
import { useState, useEffect } from "react";
import { loadBooks } from "@/lib/data";
import { BookCard } from "@/components/BookCard";
import { Book } from "@/lib/data";

export default function SearchPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadBooks().then(setBooks);
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Search the Library</h1>
      <input
        type="text"
        placeholder="Search by title, author, or Dolch %..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full max-w-md px-6 py-4 bg-white/5 border border-white/10 rounded-3xl text-lg mb-8 focus:outline-none focus:border-emerald-400"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredBooks.map(book => (
          <BookCard
            key={book.id}
            id={book.id}
            title={book.title}
            author={book.author}
            dolch={book.dolchBreadth}
            fry={book.frySight}
          />
        ))}
      </div>
      {filteredBooks.length === 0 && (
        <p className="text-center text-slate-400 mt-12">No books match your search.</p>
      )}
    </div>
  );
}
