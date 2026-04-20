// app/book/[id]/ClientBookAction.tsx
'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function ClientBookAction({ id }: { id: string }) {
  const { isPremium } = useAuth();

  const handleDownload = (format: 'epub' | 'pdf') => {
    if (!isPremium) return;
    const filename = `${id}.${format}`;
    console.log(`📥 Download requested: ${filename}`);
    // Future: link to Supabase Storage bucket "downloads"
    alert(`✅ ${format.toUpperCase()} download started for book ${id} (placeholder — real file coming soon)`);
    // Example real link later: window.location.href = `https://...supabase.co/storage/.../${filename}`;
  };

  if (isPremium) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <a
          href={`/analyze/${id}`}
          className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-3xl transition text-lg"
        >
          Open Full Rocket Reader Edition →
        </a>

        <button
          onClick={() => handleDownload('epub')}
          className="inline-flex items-center justify-center bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-6 py-4 rounded-3xl transition"
        >
          📘 Download EPUB
        </button>

        <button
          onClick={() => handleDownload('pdf')}
          className="inline-flex items-center justify-center bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-6 py-4 rounded-3xl transition"
        >
          📕 Download PDF
        </button>
      </div>
    );
  }

  // Free user view
  return (
    <div className="text-center">
      <p className="text-slate-600 mb-4">This is a Sample preview.</p>
      <a
        href="/premium"
        className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-10 py-4 rounded-3xl transition text-lg"
      >
        Upgrade to Premium to unlock full interactive edition
      </a>
    </div>
  );
}