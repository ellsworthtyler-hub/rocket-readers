// components/MetricGrid.tsx
import { CheckCircle } from "lucide-react";

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

export default function MetricGrid({ stats }: MetricGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {[
        { label: "DOLCH BREADTH %", value: stats.dolchBreadth, color: "emerald" },
        { label: "DOLCH SIGHT WORD %", value: stats.dolchSight, color: "emerald" },
        { label: "FRY SIGHT WORD %", value: stats.frySight, color: "amber" },
        { label: "FLESCH GRADE SCORE", value: stats.fleschGrade, color: "emerald" },
        { label: "FLESCH READING EASE", value: stats.fleschEase, color: "emerald" },
        { label: "DIALOG RATIO", value: stats.dialogRatio, color: "emerald" },
      ].map((item, i) => (
        <div key={i} className="bg-white/5 p-6 rounded-3xl flex items-center gap-4">
          <CheckCircle className={`w-10 h-10 text-${item.color}-400`} />
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest">{item.label}</p>
            <p className="text-3xl font-bold">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
