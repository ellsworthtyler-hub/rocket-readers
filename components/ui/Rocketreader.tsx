//  FILE: components/ui/Rocketreader.tsx
//  =======================================
//  UPDATED (2026-05): Major rewrite for the rr_ + R2 era.

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

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
  const { isPremium } = useAuth();
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isProcessed) {
      setLoading(false);
      return;
    }

    const variant = isPremium ? 'full' : 'sample';

    async function loadContent() {
      setLoading(true);
      try {
        const res = await fetch(`/api/read/${sourceId}?variant=${variant}`);
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
  }, [sourceId, isProcessed, isPremium]);

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
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-900 text-white text-sm font-medium flex items-center justify-between">
        <div>
          {title} {author && `by ${author}`}
        </div>
        <div className="text-xs text-slate-400">
          {isPremium ? 'PREMIUM FULL EDITION' : 'FREE SAMPLE'}
        </div>
      </div>

      <div
        className="prose prose-slate max-w-none p-8"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      <div className="border-t p-4 text-center">
        <Link href={`/book/${sourceId}`} className="text-emerald-600 hover:underline text-sm">
          ← Back to book statistics
        </Link>
      </div>
    </div>
  );
}
