// app/search/page.tsx
import { loadBooks } from "@/lib/data";
import { BookCard } from "@/components/BookCard";

export default async function SearchPage() {
  const books = await loadBooks();

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Search the Library</h1>
      <input 
        type="text" 
        placeholder="Search by title, author, or Dolch %..." 
        className="w-full max-w-md px-6 py-4 bg-white/5 border border-white/10 rounded-3xl text-lg mb-8"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {books.map(book => (
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
