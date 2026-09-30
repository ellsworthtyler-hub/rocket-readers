'use client';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PacketPage() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const { isPremium, loading } = useAuth();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !isPremium || !sourceId) return;
    let cancelled = false;
    let objectUrl = '';

    async function load() {
      const { data } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (data.session?.access_token) {
        headers.Authorization = `Bearer ${data.session.access_token}`;
      }
      const res = await fetch(`/api/packets/${sourceId}`, { headers, cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (!cancelled) setError(body.error || 'Could not open this packet.');
        return;
      }
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
      if (!cancelled) setPdfUrl(objectUrl);
    }

    load().catch(() => {
      if (!cancelled) setError('Could not open this packet.');
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [loading, isPremium, sourceId]);

  if (loading) {
    return <div className="p-12 text-center text-slate-300">Opening the classwork packet...</div>;
  }

  if (!isPremium) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Classwork packets</h1>
        <p className="text-slate-300 mb-6">
          These packets are part of Premium and Teacher. The free library and book stats stay open.
        </p>
        <Link href="/premium" className="inline-block bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl">
          See plans
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Packet not available</h1>
        <p className="text-slate-300 mb-6">{error}</p>
        <Link href={`/book/${sourceId}`} className="text-emerald-300 font-semibold">← Back to this book</Link>
      </div>
    );
  }

  if (!pdfUrl) {
    return <div className="p-12 text-center text-slate-300">Loading the packet from Cloudflare...</div>;
  }

  return (
    <iframe
      title="Classwork packet"
      src={pdfUrl}
      className="block w-full border-0 bg-white"
      style={{ height: 'calc(100vh - 4.5rem)' }}
    />
  );
}
