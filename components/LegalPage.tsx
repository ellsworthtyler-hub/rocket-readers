import type { ReactNode } from 'react';

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-12 md:py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-center text-amber-700 font-semibold text-sm mb-3">
          Draft, last updated October 2026
        </p>
        <h1 className="font-calm-serif text-4xl md:text-5xl font-bold text-slate-900 mb-6 text-center tracking-tight">
          {title}
        </h1>
        <div className="calm-card space-y-5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}
