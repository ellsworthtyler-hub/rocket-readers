// components/BookCard.tsx
import Link from "next/link";
import { Rocket } from "lucide-react";

interface BookCardProps {
  id: string;
  title: string;
  author?: string;
  dolch: string;
  fry: string;
  dialogRatio?: string;
  fleschGrade?: string;
}

export function BookCard({ id, title, author = "Unknown", dolch, fry, dialogRatio, fleschGrade }: BookCardProps) {
  const toPercent = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";
    // Smart: Supabase already stores Dialog as percent (e.g. 48.26) — don't double-multiply
    return num > 1 ? `${num.toFixed(1)}%` : `${(num * 100).toFixed(1)}%`;
  };

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

        {/* Row 1: Dolch and Fry */}
        <div className="flex gap-3 text-xs mb-3">
          <div className="bg-emerald-900/50 text-emerald-300 px-3 py-1 rounded-2xl flex items-center gap-1 flex-1">
            <span className="font-mono">Dolch</span>
            <span className="font-bold">{toPercent(dolch)}</span>
          </div>
          <div className="bg-amber-900/50 text-amber-300 px-3 py-1 rounded-2xl flex items-center gap-1 flex-1">
            <span className="font-mono">Fry</span>
            <span className="font-bold">{toPercent(fry)}</span>
          </div>
        </div>

        {/* Row 2: Dialog Ratio + Flesch Grade (clean styling) */}
        <div className="flex gap-3 text-xs">
          <div className="bg-emerald-900/50 text-emerald-300 px-3 py-1 rounded-2xl flex items-center gap-1 flex-1">
            <span className="font-mono">Dialog</span>
            <span className="font-bold">{dialogRatio ? toPercent(dialogRatio) : "N/A"}</span>
          </div>
          <div className="bg-amber-900/50 text-amber-300 px-3 py-1 rounded-2xl flex items-center gap-1 flex-1">
            <span className="font-mono">Flesch</span>
            <span className="font-bold">{fleschGrade || "N/A"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
