//  FILE: components/BookCard.tsx
//  ===============================

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
      className="block bg-slate-100 border border-slate-400 rounded-2xl p-4 hover:border-emerald-500 hover:shadow-lg transition-all group h-full flex flex-col"
    >
      <div className="font-semibold text-slate-900 text-base line-clamp-2 mb-1 group-hover:text-emerald-700 transition">
        {title}
      </div>
      {author && (
        <div className="text-slate-500 text-xs mb-3 line-clamp-1">
          {author}
        </div>
      )}

      {/* Tighter gap, smaller padding inside the stat boxes */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <div className="bg-emerald-200 rounded-xl p-2 text-center border border-emerald-100">
          <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Dolch</div>
          <div className="text-lg font-bold text-emerald-800">
            {toPercent(dolch)} {getEmoticon(dolchNum)}
          </div>
        </div>

        <div className="bg-amber-200 rounded-xl p-2 text-center border border-amber-100">
          <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Fry</div>
          <div className="text-lg font-bold text-amber-800">
            {toPercent(fry)} {getEmoticon(fryNum)}
          </div>
        </div>

        <div className="bg-sky-200 rounded-xl p-2 text-center border border-sky-100">
          <div className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">Dialogue</div>
          <div className="text-lg font-bold text-sky-800">
            {toPercent(dialogRatio)} {getEmoticon(dialogNum)}
          </div>
        </div>

        <div className="bg-violet-200 rounded-xl p-2 text-center border border-violet-100">
          <div className="text-[10px] text-violet-600 font-bold uppercase tracking-wider">Flesch</div>
          <div className="text-lg font-bold text-violet-800">
            {fleschNum.toFixed(1)} {getEmoticon(fleschNum, true)}
          </div>
        </div>
      </div>
    </Link>
  );
}