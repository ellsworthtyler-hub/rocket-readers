// app/book/[id]/ClientBookAction.tsx
'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function ClientBookAction({ id }: { id: string }) {
  const { isPremium } = useAuth();

  if (isPremium) {
    return (
      <a
        href={`/analyze/${id}`}
        className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-10 py-4 rounded-3xl transition text-lg"
      >
        Open Full Rocket Reader Edition →
      </a>
    );
  }

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