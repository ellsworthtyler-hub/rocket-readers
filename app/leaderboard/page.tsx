// app/leaderboard/page.tsx
'use client';
import { useState, useEffect } from "react";
import { loadBooks } from "@/lib/data";
import { BookCard } from "@/components/BookCard";
import { Book } from "@/lib/data";

export default function LeaderboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [sortBy, setSortBy] = useState<"dolch" | "fry" | "flesch" | "dialog">("dolch");

  useEffect(() => {
    loadBooks().then(setBooks);
  }, []);

  const sortedBooks = [...books].sort((a, b) => {
    if (sortBy === "dolch") return parseFloat(b.dolchBreadth) - parseFloat(a.dolchBreadth);
    if (sortBy === "fry") return parseFloat(b.frySight) - parseFloat(a.frySight);
    if (sortBy === "flesch") return parseFloat(b.fleschGrade) - parseFloat(a.fleschGrade);
    if (sortBy === "dialog") return parseFloat(b.dialogRatio) - parseFloat(a.dialogRatio);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Leaderboard</h1>
      <div className="flex gap-4 mb-8 flex-wrap">
        <button onClick={() => setSortBy("dolch")} className={`px-6 py-3 rounded-3xl ${sortBy === "dolch" ? "bg-emerald-400 text-slate-950" : "bg-white/10"}`}>Highest Dolch %</button>
        <button onClick={() => setSortBy("fry")} className={`px-6 py-3 rounded-3xl ${sortBy === "fry" ? "bg-emerald-400 text-slate-950" : "bg-white/10"}`}>Highest Fry %</button>
        <button onClick={() => setSortBy("flesch")} className={`px-6 py-3 rounded-3xl ${sortBy === "flesch" ? "bg-emerald-400 text-slate-950" : "bg-white/10"}`}>Best Flesch Ease</button>
        <button onClick={() => setSortBy("dialog")} className={`px-6 py-3 rounded-3xl ${sortBy === "dialog" ? "bg-emerald-400 text-slate-950" : "bg-white/10"}`}>Highest Dialogue Ratio</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sorted.slice(0, 30).map((book, index) => (
		<div key={book.id} className="relative">
		<div className="absolute -top-2 -left-2 bg-emerald-400 text-slate-950 text-xs font-bold w-6 h-6 rounded-2xl flex items-center justify-center">{index + 1}</div>
		<BookCard ... />
	  </div>
))}
    </div>
  );
}
