// components/BookCard.tsx
import Link from 'next/link';

interface BookCardProps {
  id: string;
  title: string;
  author?: string;
  dolch: string;
  fry: string;
  dialogRatio: string;
  fleschGrade: string;
}

function getEmoticon(value: number, isFlesch = false): string {
  if (isFlesch) {
    if (value <= 4) return '🚀';
    if (value <= 8) return '🔥';
    return '✅';
  }
  if (value >= 60) return '🚀';
  if (value >= 40) return '🔥';
  return '✅';
}

function toPercent(val: string | number): string {
  const num = typeof val === 'number' ? val : parseFloat(val || '0');
  return `${num.toFixed(1)}%`;
}

export function BookCard({
  id,
  title,
  author,
  dolch,
  fry,
  dialogRatio,
  fleschGrade,
}: BookCardProps) {
  const dolchNum = parseFloat(dolch);
  const fryNum = parseFloat(fry);
  const dialogNum = parseFloat(dialogRatio);
  const fleschNum = parseFloat(fleschGrade);

  return (
    <Link
      href={`/book/${id}`}
      className="block bg-white border border-slate-200 rounded-3xl p-6 hover:border-emerald-500 hover:shadow-xl transition-all group h-full flex flex-col"
    >
      <div className="font-semibold text-slate-900 text-lg line-clamp-2 mb-2 group-hover:text-emerald-700 transition">
        {title}
      </div>
      {author && (
        <div className="text-slate-500 text-sm mb-4 line-clamp-1">
          {author}
        </div>
      )}

      {/* Two-row stats */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        {/* Row 1: Dolch & Fry */}
        <div className="bg-emerald-50 rounded-2xl p-3 text-center">
          <div className="text-xs text-emerald-600 font-medium">Dolch</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {toPercent(dolch)} {getEmoticon(dolchNum)}
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl p-3 text-center">
          <div className="text-xs text-amber-600 font-medium">Fry</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {toPercent(fry)} {getEmoticon(fryNum)}
          </div>
        </div>

        {/* Row 2: Dialogue & Flesch */}
        <div className="bg-sky-50 rounded-2xl p-3 text-center">
          <div className="text-xs text-sky-600 font-medium">Dialogue</div>
          <div className="text-2xl font-bold text-sky-700 mt-1">
            {toPercent(dialogRatio)} {getEmoticon(dialogNum)}
          </div>
        </div>

        <div className="bg-violet-50 rounded-2xl p-3 text-center">
          <div className="text-xs text-violet-600 font-medium">Flesch Grade</div>
          <div className="text-2xl font-bold text-violet-700 mt-1">
            {fleschGrade} {getEmoticon(fleschNum, true)}
          </div>
        </div>
      </div>

      <div className="mt-6 text-emerald-600 text-sm font-medium flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
        View Rocket Reader →
      </div>
    </Link>
  );
}