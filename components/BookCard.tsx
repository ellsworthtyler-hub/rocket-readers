//  FILE: components/BookCard.tsx
//  Cosmic-styled book cards for library / leaderboard / home

import Link from 'next/link';

interface BookCardProps {
  id: string;
  title: string;
  author?: string;
  dolch: string;
  fry: string;
  dialogRatio: string;
  fleschGrade: string;
  libraryStats?: any;
}

function getBadge(value: number, metricPrefix: string, stats: any, isFlesch = false): string {
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

  const EPSILON = 0.001;

  if (isFlesch) {
    if (value <= stats.flesch_top_90 + EPSILON) return '💎';
    if (value <= stats.flesch_top_75 + EPSILON) return '🚀';
    if (value <= stats.flesch_top_50 + EPSILON) return '🔥';
    if (value <= stats.flesch_top_25 + EPSILON) return '✅';
    return '📈';
  }

  if (value >= stats[`${metricPrefix}_top_5`] - EPSILON) return '💎';
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

  // WOW! = truly elite only (≈ top 5% Dolch in the library).
  // Previously also used 🚀 (top 10%) and a static fallback (Dolch ≥ 60%), which
  // tagged nearly every card once library percentiles failed or the bar was low.
  const dolchBadge = getBadge(dolchNum, 'dolch', libraryStats);
  const wow =
    dolchBadge === '💎' ||
    // If percentiles are unavailable, require a very high absolute Dolch density
    (!libraryStats && dolchNum >= 75);

  return (
    <Link href={`/book/${id}`} className="cosmic-card group">
      {wow && (
        <span
          className="absolute top-3 right-3 bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full rotate-6"
          title="Elite Dolch density (top ~5% of the library)"
        >
          WOW!
        </span>
      )}
      <div className={`mb-3 ${wow ? 'pr-12' : ''}`}>
        <h3 className="font-display font-bold text-lg text-slate-50 line-clamp-2 group-hover:text-emerald-300 transition-colors mb-1">
          {title}
        </h3>
        <p className="text-slate-400 text-sm line-clamp-1 font-semibold">
          {author || 'Unknown Author'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto">
        <div className="cosmic-stat-dolch">
          <div className="text-[10px] uppercase tracking-wider opacity-80">Dolch</div>
          <div>
            {toPercent(dolch)} {getBadge(dolchNum, 'dolch', libraryStats)}
          </div>
        </div>
        <div className="cosmic-stat-fry">
          <div className="text-[10px] uppercase tracking-wider opacity-80">Fry</div>
          <div>
            {toPercent(fry)} {getBadge(fryNum, 'fry', libraryStats)}
          </div>
        </div>
        <div className="cosmic-stat-dialog">
          <div className="text-[10px] uppercase tracking-wider opacity-80">Dialogue</div>
          <div>
            {toPercent(dialogRatio)} {getBadge(dialogNum, 'dialog', libraryStats)}
          </div>
        </div>
        <div className="cosmic-stat-flesch">
          <div className="text-[10px] uppercase tracking-wider opacity-80">Grade</div>
          <div>
            {fleschNum.toFixed(1)} {getBadge(fleschNum, 'flesch', libraryStats, true)}
          </div>
        </div>
      </div>
    </Link>
  );
}
