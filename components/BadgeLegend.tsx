// components/BadgeLegend.tsx
export function BadgeLegend() {
  return (
    <div className="mb-6 p-4 bg-slate-800/90 border-2 border-slate-600 rounded-2xl text-sm text-slate-100">
      <div className="font-semibold text-amber-200 mb-2">How to read the badges</div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-1 text-xs">
        <div>💎 Elite (Top 5%)</div>
        <div>🚀 Incredible (Top 10%)</div>
        <div>🔥 Great (Top 25%)</div>
        <div>✅ Above Avg (Top 50%)</div>
        <div>📈 Needs Work</div>
      </div>
    </div>
  );
}