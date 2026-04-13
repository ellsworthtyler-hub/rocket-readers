// app/analyze/[id]/page.tsx
'use client';

import { useAuth } from '@/components/AuthProvider';
import { loadBooks } from '@/lib/data';
import RocketReader from '@/components/RocketReader';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AnalyzePage() {
  const { isPremium, loading: authLoading } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [book, setBook] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isPremium && !authLoading) {
      window.location.href = '/premium';
      return;
    }

    // Load book metadata
    loadBooks().then((allBooks) => {
      const found = allBooks.find((b: any) => b.id === id);
      if (found) setBook(found);
      else notFound();
    });

    // Build exact URL from your screenshot
    const projectRef = "mckxrkpmlgbgyaujhbuu";   // Confirmed from your Get URL
    const fileUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/enhanced-readers/${id}.html`;

    console.log("🚀 Attempting to fetch:", fileUrl);

    fetch(fileUrl, { 
      mode: 'cors',
      cache: 'no-store'
    })
      .then(res => {
        console.log("Fetch status:", res.status, res.statusText);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.text();
      })
      .then(html => {
        console.log("✅ Successfully loaded HTML (length:", html.length, "chars)");
        setHtmlContent(html);
        setErrorMsg('');
      })
      .catch((err) => {
        console.error("❌ Fetch error:", err);
        setErrorMsg(`Could not load ${id}.html — check console for details`);
        setHtmlContent(`
          <div class="prose max-w-none bg-slate-900 p-8 rounded-3xl border border-white/10 text-white text-center">
            <h1 class="text-4xl font-bold mb-6 text-red-400">Failed to load Rocket Reader Edition</h1>
            <p>Tried: ${fileUrl}</p>
            <p>Error: ${err.message}</p>
            <p class="mt-8">Try opening the URL directly in a new tab to verify.</p>
          </div>
        `);
      });
  }, [id, isPremium, authLoading]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center text-xl">Loading premium features...</div>;
  if (!isPremium) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link href={`/book/${id}`} className="text-emerald-600 hover:underline mb-8 inline-block">
        ← Back to Book Stats
      </Link>

      <h1 className="text-4xl font-bold mb-2">{book?.title || 'Loading...'}</h1>
      {book?.author && <p className="text-slate-600 text-xl">{book.author}</p>}

      <div className="mt-8">
        <RocketReader html={htmlContent} />
      </div>

      {errorMsg && <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">{errorMsg}</div>}

      <div className="mt-12 text-center text-sm text-slate-500">
        Premium feature • Unlimited enhanced editions with sight-word highlights, POS toggles, charts &amp; downloads
      </div>
    </div>
  );
}