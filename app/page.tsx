// app/page.tsx
import Link from "next/link";
import { BookCard } from "@/components/BookCard";
import { Rocket } from "lucide-react";
import { loadBooks } from "@/lib/data";

export default async function Home() {
  const books = await loadBooks();

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="text-center py-20 bg-gradient-to-br from-emerald-900 to-slate-950 rounded-3xl mb-16">
        <div className="flex justify-center mb-6">
          <Rocket className="w-16 h-16 text-emerald-400" />
        </div>
        <h1 className="text-6xl font-bold tracking-tighter mb-4 text-white">Rocket Readers</h1>
        <p className="text-2xl text-emerald-300 mb-8">
          Sight-word coverage • Dialogue ratio • Flesch scores • Instant Rocket Editions
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/leaderboard" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-3xl text-lg transition">Check the Leaderboards!</Link>
          <Link href="/search" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-3xl text-lg transition">Find the Perfect Book for You</Link>
          <Link href="/analyze" className="px-8 py-4 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-semibold rounded-3xl text-lg transition">Analyze Any Book Now →</Link>
        </div>
      </div>

      {/* Hot off the Launchpad */}
      <h2 className="text-3xl font-semibold mb-6 flex items-center gap-2">
        Hot off the Launchpad 
        <span className="text-emerald-400 text-xl">🚀</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {books.slice(0, 3).map((book) => (
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

      <div className="text-center mt-12">
        <Link href="/search" className="text-emerald-400 hover:text-emerald-300 text-lg font-medium">
          See all {books.length.toLocaleString()}+ analyzed books →
        </Link>
      </div>
    </main>
  );
}
