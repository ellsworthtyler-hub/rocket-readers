// components/MetricGrid.tsx
import { CheckCircle } from 'lucide-react';

interface MetricGridProps {
  stats: {
    dolchBreadth: string;
    dolchSight: string;
    frySight: string;
    fleschGrade: string;
    fleschEase: string;
    dialogRatio: string;
  };
}

const ITEMS: {
  key: keyof MetricGridProps['stats'];
  label: string;
  iconClass: string;
}[] = [
  { key: 'dolchBreadth', label: 'DOLCH BREADTH %', iconClass: 'text-emerald-400' },
  { key: 'dolchSight', label: 'DOLCH SIGHT WORD %', iconClass: 'text-emerald-400' },
  { key: 'frySight', label: 'FRY SIGHT WORD %', iconClass: 'text-amber-400' },
  { key: 'fleschGrade', label: 'FLESCH GRADE SCORE', iconClass: 'text-emerald-400' },
  { key: 'fleschEase', label: 'FLESCH READING EASE', iconClass: 'text-emerald-400' },
  { key: 'dialogRatio', label: 'DIALOG RATIO', iconClass: 'text-emerald-400' },
];

export default function MetricGrid({ stats }: MetricGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {ITEMS.map((item) => (
        <div key={item.key} className="bg-white/5 p-6 rounded-3xl flex items-center gap-4">
          <CheckCircle className={`w-10 h-10 ${item.iconClass}`} />
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest">{item.label}</p>
            <p className="text-3xl font-bold">{stats[item.key]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
