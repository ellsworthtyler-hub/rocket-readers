// app/analyze/[id]/page.tsx
'use client';

import { useAuth } from '@/components/AuthProvider';
import { loadBooks } from '@/lib/data';
import RocketReader from '@/components/RocketReader';   // ← FIXED: default import (no curly braces)
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AnalyzePage() {
  const { isPremium, loading } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [book, setBook] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    if (!isPremium && !loading) {
      window.location.href = '/premium';
      return;
    }

    loadBooks().then((allBooks) => {
      const found = allBooks.find((b: any) => b.id === id);
      if (found) setBook(found);
      else notFound();
    });

    // Placeholder for now — we'll load real polished HTML in the next step
    setHtmlContent(`
      <div class="prose max-w-none bg-slate-900 p-8 rounded-3xl border border-white/10 text-white">
        <h2 class="text-3xl font-bold mb-6">🚀 Full Rocket Reader Edition</h2>
        <p class="mb-8">This is where your enhanced HTML (with Dolch/Fry/POS toggles) will appear.</p>
        <p class="text-emerald-400">Toggle highlights • Charts • Word-length distribution • One-click EPUB/PDF</p>
      </div>
    `);
  }, [id, isPremium, loading]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-xl">Loading premium features...</div>;
  if (!isPremium) return null; // already redirected

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link href={`/book/${id}`} className="text-emerald-600 hover:underline mb-8 inline-block">
        ← Back to Book Stats
      </Link>

      <h1 className="text-4xl font-bold mb-2">{book?.title}</h1>
      {book?.author && <p className="text-slate-600 text-xl">{book.author}</p>}

      <div className="mt-8">
        <RocketReader html={htmlContent} />
      </div>

      <div className="mt-12 text-center text-sm text-slate-500">
        Premium feature • Unlimited enhanced editions with sight-word highlights, POS toggles, charts &amp; downloads
      </div>
    </div>
  );
}