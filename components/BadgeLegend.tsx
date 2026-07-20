//  FILE: components/BadgeLegend.tsx

export function BadgeLegend() {
  return (
    <div className="w-full mb-8 flex flex-wrap items-center justify-center gap-2">
      {[
        { emoji: '💎', label: 'Elite (Top 5%)' },
        { emoji: '🚀', label: 'Incredible (Top 10%)' },
        { emoji: '🔥', label: 'Great (Top 25%)' },
        { emoji: '✅', label: 'Above Avg (Top 50%)' },
        { emoji: '📈', label: 'Fair (Top 75%)' },
      ].map((b) => (
        <span key={b.label} className="badge-pill flex items-center gap-1.5">
          <span>{b.emoji}</span> {b.label}
        </span>
      ))}
    </div>
  );
}
