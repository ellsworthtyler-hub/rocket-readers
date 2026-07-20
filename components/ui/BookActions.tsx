//  FILE:  components/ui/BookActions.tsx
//  Freemium action bar: Gutenberg + sample + full + classwork packets
//  bookId / gutenbergId = public Gutenberg source_id

'use client';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface BookActionsProps {
  /** Public Gutenberg source_id for /book and /read routes */
  bookId: string | number;
  /** Same public ID for gutenberg.org link */
  gutenbergId: string | number;
}

export default function BookActions({ bookId, gutenbergId }: BookActionsProps) {
  const { isPremium, loading } = useAuth();
  const router = useRouter();
  const [packetBusy, setPacketBusy] = useState(false);
  const id = String(bookId);

  const handlePacketDownload = async () => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }

    setPacketBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`/api/packets/${id}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.status === 401 || res.status === 403) {
        router.push('/premium');
        return;
      }

      if (res.status === 404) {
        alert('Classwork packet is not available for this book yet. Please check back soon.');
        return;
      }

      if (!res.ok) {
        alert('Could not start packet download. Please try again.');
        return;
      }

      const json = await res.json();
      if (json?.url) {
        window.open(json.url, '_blank');
        return;
      }

      alert('Classwork packet is not available for this book yet.');
    } catch (err) {
      console.error(err);
      alert('Could not start packet download. Please try again.');
    } finally {
      setPacketBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 mb-10 mt-[-10px]">
      <div className="flex flex-col md:flex-row gap-4">
        {/* 1. Always free: Gutenberg */}
        <a
          href={`https://www.gutenberg.org/ebooks/${gutenbergId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-4 px-4 border-2 border-slate-500 text-slate-200 font-bold rounded-2xl text-center bg-slate-800/80 hover:bg-slate-700 hover:border-slate-400 transition"
        >
          Get the FREE ebook here!
        </a>

        {/* 2. Always free: sample enhanced */}
        <Link
          href={`/read/${id}?sample=true`}
          className="flex-1 py-4 px-4 bg-emerald-900/50 text-emerald-200 font-bold rounded-2xl text-center border-2 border-emerald-500/60 hover:bg-emerald-800/60 transition"
        >
          Read Free Sample
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* 3. Premium: full enhanced */}
        {loading ? (
          <div className="flex-[2] py-4 px-4 bg-slate-800 text-slate-500 font-bold rounded-2xl text-center animate-pulse">
            Loading…
          </div>
        ) : isPremium ? (
          <Link
            href={`/read/${id}`}
            className="flex-[2] py-4 px-4 bg-emerald-600 text-white font-bold rounded-2xl text-center hover:bg-emerald-500 transition shadow-sm"
          >
            Read Full Enhanced Ebook
          </Link>
        ) : (
          <Link
            href="/premium"
            className="flex-[2] py-4 px-4 bg-slate-800/90 text-slate-300 font-bold rounded-2xl text-center border-2 border-slate-600 flex items-center justify-center gap-2 hover:border-emerald-500/50 transition"
          >
            <span>🔒</span> Unlock Full Enhanced Ebook
          </Link>
        )}

        {/* 4. Premium: classwork packets */}
        {loading ? (
          <div className="flex-1 py-4 px-4 bg-slate-800 text-slate-500 font-bold rounded-2xl text-center animate-pulse">
            …
          </div>
        ) : isPremium ? (
          <button
            type="button"
            onClick={handlePacketDownload}
            disabled={packetBusy}
            className="flex-1 py-4 px-4 bg-emerald-800/60 text-emerald-100 font-bold rounded-2xl text-center border border-emerald-500/40 hover:bg-emerald-700/60 transition disabled:opacity-60"
          >
            {packetBusy ? 'Preparing…' : 'Download Classwork Packet'}
          </button>
        ) : (
          <Link
            href="/premium"
            className="flex-1 py-4 px-4 bg-slate-800/90 text-slate-400 font-bold rounded-2xl text-center border-2 border-slate-600 flex items-center justify-center gap-2 hover:border-slate-500 transition"
          >
            <span>🔒</span> Classwork Packets
          </Link>
        )}
      </div>

      {!loading && !isPremium && (
        <p className="text-xs text-center text-slate-400">
          Free: Gutenberg original + sample enhanced edition. Premium: full interactive ebook + 10-week classwork packet.
        </p>
      )}
    </div>
  );
}
