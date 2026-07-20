//  FILE: components/BadgeLegend.tsx
//  Created with GEMINI AI (Pro)
//  ================================

export function BadgeLegend() {
  return (
    <div className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-8">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
        <span className="flex items-center gap-1">
          <span className="text-lg">💎</span> Elite (Top 5%)
        </span>
        <span className="flex items-center gap-1">
          <span className="text-lg">🚀</span> Incredible (Top 10%)
        </span>
        <span className="flex items-center gap-1">
          <span className="text-lg">🔥</span> Great (Top 25%)
        </span>
        <span className="flex items-center gap-1">
          <span className="text-lg">✅</span> Above Avg (Top 50%)
        </span>
        <span className="flex items-center gap-1">
          <span className="text-lg">📈</span> Fair (Top 75%)
        </span>
      </div>
    </div>
  );
}