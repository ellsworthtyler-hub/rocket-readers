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
  const [isLoadingContent, setIsLoadingContent] = useState(true);

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

    // Exact URL from your Supabase "Get URL"
    const projectRef = "mckxrkpmlgbgyaujhbuu";   // ← confirmed from your screenshot
    const fileUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/enhanced-readers/${id}.html`;

    console.log("🚀 Attempting to fetch book:", id);
    console.log("📍 URL:", fileUrl);

    fetch(fileUrl, { 
      mode: 'cors',
      cache: 'no-store',
      headers: { 'Accept': 'text/html' }
    })
      .then(res => {
        console.log("📡 Response status:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status} - ${res.statusText}`);
        }
        return res.text();
      })
      .then(html => {
        console.log(`✅ SUCCESS! Loaded ${html.length} characters of HTML`);
        setHtmlContent(html);
        setErrorMsg('');
        setIsLoadingContent(false);
      })
      .catch((err) => {
        console.error("❌ Fetch failed:", err);
        setErrorMsg(`Failed to load ${id}.html from Supabase Storage`);
        setHtmlContent(`
          <div class="prose max-w-none bg-slate-900 p-8 rounded-3xl border border-white/10 text-white text-center">
            <h1 class="text-4xl font-bold mb-6 text-red-400">🚨 Could not load Rocket Reader Edition</h1>
            <p><strong>Book ID:</strong> ${id}</p>
            <p><strong>Tried URL:</strong> ${fileUrl}</p>
            <p><strong>Error:</strong> ${err.message}</p>
            <p class="mt-6 text-sm">Open the URL directly in a new tab to verify the file exists.</p>
          </div>
        `);
        setIsLoadingContent(false);
      });
  }, [id, isPremium, authLoading]);

  if (authLoading || isLoadingContent) {
    return <div className="flex min-h-screen items-center justify-center text-xl">Loading premium features...</div>;
  }

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

      {errorMsg && (
        <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="mt-12 text-center text-sm text-slate-500">
        Premium feature • Unlimited enhanced editions with sight-word highlights, POS toggles, charts &amp; downloads
      </div>
    </div>
  );
}