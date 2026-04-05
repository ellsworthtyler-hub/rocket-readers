// components/BookCard.tsx
import Link from "next/link";
import { Rocket } from "lucide-react";

interface BookCardProps {
  id: string;
  title: string;
  author?: string;
  dolch: string;
  fry: string;
}

export function BookCard({ id, title, author = "Unknown", dolch, fry }: BookCardProps) {
  return (
    <Link href={`/book/${id}`} className="group block">
      <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-6 transition-all hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg leading-tight group-hover:text-emerald-400 transition-colors">{title}</h3>
            <p className="text-slate-400 text-sm mt-1">{author}</p>
          </div>
          <Rocket className="w-6 h-6 text-emerald-400" />
        </div>
        
        <div className="flex gap-3 text-xs">
          <div className="bg-emerald-900/50 text-emerald-300 px-3 py-1 rounded-2xl flex items-center gap-1">
            <span className="font-mono">Dolch</span>
            <span className="font-bold">{dolch}</span>
          </div>
          <div className="bg-amber-900/50 text-amber-300 px-3 py-1 rounded-2xl flex items-center gap-1">
            <span className="font-mono">Fry</span>
            <span className="font-bold">{fry}</span>
          </div>
		  <div className="flex gap-3 text-xs mt-3">
			<div className="bg-white/10 text-white px-3 py-1 rounded-2xl">Dialog {book.dialogRatio}</div>
			<div className="bg-white/10 text-white px-3 py-1 rounded-2xl">Avg Word {book.avgWordLength || "N/A"}</div>
		  </div>
        </div>
      </div>
    </Link>
  );
}