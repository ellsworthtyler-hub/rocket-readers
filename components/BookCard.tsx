//  FILE: components/BookCard.tsx
//  Updated:  03-05-2026 - (v.1.1) - NEW: Updated for dynamic badges and new fallback logic.
//  Created with GEMINI AI (Pro)
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
  libraryStats?: any; // Added to pass dynamic database percentiles
}

function getBadge(value: number, metricPrefix: string, stats: any, isFlesch = false): string {
  // Fallback to static logic if database stats haven't loaded yet
  if (!stats) {
    if (isFlesch) {
      if (value <= 2) return '💎';
      if (value <= 4) return '🚀';
      if (value <= 6) return '🔥';
      if (value <= 8) return '✅';
      return '📈';
    }
    if (value >= 75) return '💎';
    if (value >= 60) return '🚀';
    if (value >= 40) return '🔥';
    if (value >= 20) return '✅';
    return '📈';
  }

  // EPSILON prevents floating-point rounding mismatches where 69.5 < 69.5000001
  const EPSILON = 0.001; 

  // Flesch Grade Logic: Lower numbers = easier reading levels
  if (isFlesch) {
    if (value <= stats.flesch_top_90 + EPSILON) return '💎'; // Top 10% Lowest Grades
    if (value <= stats.flesch_top_75 + EPSILON) return '🚀'; // Top 25% Lowest Grades
    if (value <= stats.flesch_top_50 + EPSILON) return '🔥'; // Top 50% 
    if (value <= stats.flesch_top_25 + EPSILON) return '✅'; // Top 75% 
    return '📈';
  }

  // Standard Logic: Higher percentages are better
  if (value >= stats[`${metricPrefix}_top_5`] - EPSILON)  return '💎';
  if (value >= stats[`${metricPrefix}_top_10`] - EPSILON) return '🚀';
  if (value >= stats[`${metricPrefix}_top_25`] - EPSILON) return '🔥';
  if (value >= stats[`${metricPrefix}_top_50`] - EPSILON) return '✅';
  if (value >= stats[`${metricPrefix}_top_75`] - EPSILON) return '📈';

  return '';
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
  libraryStats,
}: BookCardProps) {
  const dolchNum = parseFloat(dolch);
  const fryNum = parseFloat(fry);
  const dialogNum = parseFloat(dialogRatio);
  const fleschNum = parseFloat(fleschGrade);

  return (
    <Link
      href={`/book/${id}`}
      className="flex flex-col bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all h-full group"
    >
      <div className="mb-4">
        <h3 className="font-bold text-xl text-slate-800 line-clamp-2 group-hover:text-emerald-700 transition-colors mb-1">
          {title}
        </h3>
        <p className="text-slate-500 text-sm line-clamp-1">
          {author || 'Unknown Author'}
        </p>
      </div>

      {/* 4x Grid for Stats */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <div className="bg-emerald-200 rounded-xl p-2 text-center border border-emerald-100">
          <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Dolch</div>
          <div className="text-lg font-bold text-emerald-800">
            {toPercent(dolch)} {getBadge(dolchNum, 'dolch', libraryStats)}
          </div>
        </div>

        <div className="bg-amber-200 rounded-xl p-2 text-center border border-amber-100">
          <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Fry</div>
          <div className="text-lg font-bold text-amber-800">
            {toPercent(fry)} {getBadge(fryNum, 'fry', libraryStats)}
          </div>
        </div>

        <div className="bg-sky-200 rounded-xl p-2 text-center border border-sky-100">
          <div className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">Dialogue</div>
          <div className="text-lg font-bold text-sky-800">
            {toPercent(dialogRatio)} {getBadge(dialogNum, 'dialog', libraryStats)}
          </div>
        </div>

        <div className="bg-violet-200 rounded-xl p-2 text-center border border-violet-100">
          <div className="text-[10px] text-violet-600 font-bold uppercase tracking-wider">Flesch Grade</div>
          <div className="text-lg font-bold text-violet-800">
            {fleschNum.toFixed(1)} {getBadge(fleschNum, 'flesch', libraryStats, true)}
          </div>
        </div>
      </div>
    </Link>
  );
}