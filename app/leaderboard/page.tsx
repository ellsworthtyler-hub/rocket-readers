// app/leaderboard/page.tsx
import { loadBooks } from "@/lib/data";
import { BookCard } from "@/components/BookCard";

export default async function LeaderboardPage() {
  const books = await loadBooks();

  const sorted = [...books].sort((a, b) => 
    parseFloat(b.dolchBreadth) - parseFloat(a.dolchBreadth)
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Leaderboard</h1>
      <p className="text-slate-400 mb-8">Top books by Dolch breadth % (best for early readers)</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sorted.slice(0, 9).map(book => (
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
    </div>
  );
}
