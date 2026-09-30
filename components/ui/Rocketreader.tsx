//  FILE: components/ui/Rocketreader.tsx
//  =======================================
//  UPDATED (2026-05): Major rewrite for the rr_ + R2 era.

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

const READER_FIT = `<style id="rr-reader-fit">
  #sticky-header .justify-between,
  .floating-bar .justify-between {
    justify-content: center !important;
  }
</style>`;

function prepareReaderHtml(html: string): string {
  if (html.includes('rr-reader-fit')) return html;
  if (html.includes('</head>')) return html.replace('</head>', `${READER_FIT}</head>`);
  return READER_FIT + html;
}

interface RocketReaderProps {
  sourceId: string;
  internalBookId: number;
  title: string;
  author: string;
  metadata: any | null;
  isProcessed: boolean;
  currentPage?: number;
}

export default function RocketReader({
  sourceId,
  internalBookId,
  title,
  author,
  metadata,
  isProcessed,
  currentPage = 1,
}: RocketReaderProps) {
  const { isPremium, loading: authLoading } = useAuth();
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isProcessed) {
      setLoading(false);
      return;
    }

    const variant = isPremium ? 'full' : 'sample';

    async function loadContent() {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const headers: HeadersInit = {};
        if (data.session?.access_token) {
          headers.Authorization = `Bearer ${data.session.access_token}`;
        }
        const res = await fetch(`/api/read/${sourceId}?variant=${variant}`, {
          headers,
          cache: 'no-store',
        });
        if (res.ok) {
          const text = await res.text();
          setHtmlContent(text);
        } else {
          setHtmlContent(null);
        }
      } catch (e) {
        console.error('Failed to load reader content', e);
        setHtmlContent(null);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [sourceId, isProcessed, isPremium, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse text-slate-500">Loading enhanced reader...</div>
      </div>
    );
  }

  if (!isProcessed) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="text-2xl font-semibold mb-2">Enhanced Reader In Preparation</h2>
        <p className="text-slate-600 max-w-md mx-auto">
          This book is still being processed. The full interactive version will be available soon.
        </p>
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
        <p className="text-slate-600">Enhanced reader content not yet available for this book.</p>
        <Link href={`/book/${sourceId}`} className="mt-4 inline-block text-emerald-600 hover:underline">
          ← Back to book details
        </Link>
      </div>
    );
  }

  return (
    <iframe
      title={`${title} ${isPremium ? 'full edition' : 'sample edition'}`}
      srcDoc={prepareReaderHtml(htmlContent)}
      sandbox="allow-scripts allow-popups"
      className="block w-full border-0 bg-white"
      style={{ height: 'calc(100vh - 8.5rem)' }}
    />
  );
}
