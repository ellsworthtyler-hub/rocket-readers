//  FILE: components/ui/Rocketreader.tsx
//  =======================================
//  Content: pre-published HTML (sample or full) via /api/read/[sourceId].
//  Premium status controls sample vs full; server enforces full paywall.

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

interface RocketReaderProps {
  /** Public Gutenberg source_id (URL id) */
  sourceId: string;
  /** Internal rr_book.id — not shown to users in production */
  internalBookId: number;
  title: string;
  author: string;
  metadata: any | null;
  isProcessed: boolean;
  currentPage?: number;
  /** Force sample even for premium (e.g. ?sample=true) */
  forceSample?: boolean;
}

export default function RocketReader({
  sourceId,
  internalBookId,
  title,
  author,
  metadata,
  isProcessed,
  forceSample = false,
}: RocketReaderProps) {
  const { user, isPremium, loading: authLoading } = useAuth();

  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);
  const [variant, setVariant] = useState<'sample' | 'full'>('sample');

  useEffect(() => {
    let cancelled = false;

    async function loadPublishedContent() {
      setIsLoadingContent(true);
      setContentError(null);

      const desiredVariant: 'sample' | 'full' =
        !forceSample && isPremium ? 'full' : 'sample';
      setVariant(desiredVariant);

      try {
        // Attach session JWT so server can authorize full variant
        let authHeader: HeadersInit = {};
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          authHeader = { Authorization: `Bearer ${token}` };
        }

        const res = await fetch(`/api/read/${sourceId}?variant=${desiredVariant}`, {
          credentials: 'include',
          headers: authHeader,
        });

        if (res.status === 401 || res.status === 403) {
          // Should only happen if client thought premium but server disagrees
          if (desiredVariant === 'full') {
            // Fall back to sample for degraded experience
            const sampleRes = await fetch(`/api/read/${sourceId}?variant=sample`, {
              credentials: 'include',
            });
            if (sampleRes.ok) {
              const sampleData = await sampleRes.json();
              if (!cancelled && sampleData.html) {
                setVariant('sample');
                setHtmlContent(sampleData.html);
                setContentError('PREMIUM_REQUIRED');
                return;
              }
            }
          }
          throw new Error(res.status === 401 ? 'AUTH_REQUIRED' : 'PREMIUM_REQUIRED');
        }

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('PUBLISHED_NOT_FOUND');
          }
          throw new Error(`Failed to load reader content (${res.status})`);
        }

        const data = await res.json();
        if (cancelled) return;

        if (data.html && typeof data.html === 'string') {
          setHtmlContent(data.html);
        } else {
          throw new Error('PUBLISHED_NOT_FOUND');
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unable to load the enhanced reader.';
        console.warn('[RocketReader] Content fetch issue:', message);

        if (message === 'PUBLISHED_NOT_FOUND' || !isProcessed) {
          setHtmlContent(null);
          setContentError('NOT_READY');
        } else if (message === 'PREMIUM_REQUIRED' || message === 'AUTH_REQUIRED') {
          setHtmlContent(null);
          setContentError(message);
        } else {
          setContentError(message);
        }
      } finally {
        if (!cancelled) setIsLoadingContent(false);
      }
    }

    if (!authLoading) {
      loadPublishedContent();
    }

    return () => {
      cancelled = true;
    };
  }, [sourceId, isPremium, authLoading, isProcessed, forceSample, user?.id]);

  if (authLoading || isLoadingContent) {
    return (
      <div className="flex flex-col items-center justify-center p-16 md:p-24 text-center bg-white rounded-3xl border border-slate-200 min-h-[60vh]">
        <div className="animate-pulse text-lg font-semibold tracking-[3px] uppercase text-emerald-600 mb-3">
          Preparing your Rocket Reader edition
        </div>
        <p className="text-slate-500 max-w-sm">
          Loading the enhanced interactive text with Heart words, syllable highlighting, and grammar overlays...
        </p>
      </div>
    );
  }

  if (contentError === 'PREMIUM_REQUIRED' || contentError === 'AUTH_REQUIRED') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 md:p-16 text-center max-w-3xl mx-auto">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Premium Edition</h2>
        <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
          The full interactive Rocket Reader edition of <strong>{title}</strong> is available
          with a Premium membership.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/read/${sourceId}?sample=true`}
            className="px-8 py-3.5 bg-white border-2 border-slate-300 hover:border-slate-400 font-bold rounded-2xl transition"
          >
            Read free sample
          </Link>
          <Link
            href="/premium"
            className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition shadow-sm"
          >
            Upgrade to Premium
          </Link>
        </div>
      </div>
    );
  }

  if (!isProcessed || contentError === 'NOT_READY') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 md:p-16 text-center max-w-3xl mx-auto">
        <div className="text-6xl mb-6">🚧</div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Enhanced Edition In Progress</h2>

        <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
          We are currently running a large-scale reprocessing pass across the Gutenberg collection.
          The full interactive Rocket Reader edition for <strong>{title}</strong> will be available soon.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`https://www.gutenberg.org/ebooks/${sourceId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 bg-white border-2 border-slate-300 hover:border-slate-400 font-bold rounded-2xl transition"
          >
            Read the free original on Gutenberg
          </a>

          <Link
            href="/premium"
            className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition shadow-sm"
          >
            Get Premium for early access
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <p className="mt-8 text-xs text-slate-400">
            Source ID: {sourceId} · Internal ID: {internalBookId}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative bg-white w-full rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
      {!isPremium && variant === 'sample' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-center text-sm">
          <span className="font-semibold text-amber-800">Free Sample</span>
          <span className="text-amber-700"> — first portion of the book. </span>
          <Link href="/premium" className="font-bold underline text-amber-900 hover:text-amber-950">
            Upgrade to Premium
          </Link>
          <span className="text-amber-700"> for the complete interactive edition + classwork packets.</span>
        </div>
      )}

      {isPremium && variant === 'full' && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-center text-xs font-bold tracking-widest text-emerald-700">
          ROCKET READER PREMIUM — FULL INTERACTIVE EDITION
        </div>
      )}

      {isPremium && variant === 'sample' && forceSample && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 text-center text-xs text-slate-600">
          Viewing sample preview ·{' '}
          <Link href={`/read/${sourceId}`} className="font-bold text-emerald-600 hover:underline">
            Open full edition
          </Link>
        </div>
      )}

      {htmlContent && (
        <div
          className="rr-published-content prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}

      {!htmlContent && contentError && contentError !== 'NOT_READY' && (
        <div className="p-12 text-center">
          <p className="text-red-600 font-semibold mb-4">We hit a temporary issue loading the enhanced reader.</p>
          <p className="text-slate-500 text-sm mb-6">{contentError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-bold"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="border-t bg-slate-50 px-6 py-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          {title} {author && `· ${author}`}
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/book/${sourceId}`} className="hover:text-emerald-600 font-medium">
            ← Back to stats
          </Link>
          <a
            href={`https://www.gutenberg.org/ebooks/${sourceId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 font-medium"
          >
            Original on Gutenberg
          </a>
          {!isPremium && (
            <Link href="/premium" className="font-bold text-emerald-600 hover:text-emerald-700">
              Unlock full edition →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
