// app/analyze/[id]/page.tsx
'use client';

import { useAuth } from '@/components/AuthProvider';
import { loadBooks } from '@/lib/data';
import { RocketReader } from '@/components/RocketReader';
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
      window.location.href = '/premium'; // redirect free users
      return;
    }

    loadBooks().then((allBooks) => {
      const found = allBooks.find((b: any) => b.id === id);
      if (found) setBook(found);
      else notFound();
    });

    // TODO: In next step we'll load the real polished HTML from Supabase Storage
    // For now we show a placeholder so the component renders
    setHtmlContent('<div class="prose text-center py-12"><h2>🚀 Full Rocket Reader Edition Loading...</h2><p>Toggle Dolch, Fry, POS highlights below.</p></div>');
  }, [id, isPremium, loading]);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
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
        Premium feature • Unlimited enhanced editions with sight-word highlights, POS toggles, and downloads
      </div>
    </div>
  );
}