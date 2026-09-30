'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { planLabel } from '@/lib/plans';

export default function NavBar() {
  const { user, adultPlan, accessVia, loading } = useAuth();
  const adultLabel = adultPlan === 'premium' || adultPlan === 'teacher' ? planLabel(adultPlan) : null;

  return (
    <nav className="sticky top-0 z-40 border-b-[3px] border-amber-400 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 min-h-16 py-2">
        <Link href="/" className="font-display font-bold text-xl text-white shrink-0 flex items-center gap-2">
          <span aria-hidden>🚀</span> Rocket Reader
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 text-sm font-bold flex-wrap justify-end">
          <Link href="/search" className="rounded-full bg-slate-800 px-3 py-1.5 text-slate-100 hover:text-emerald-300">Search</Link>
          <Link href="/parts-of-speech" className="rounded-full bg-slate-800 px-3 py-1.5 text-slate-100 hover:text-emerald-300" title="Search by part of speech">Grammar</Link>
          <Link href="/leaderboard" className="rounded-full bg-slate-800 px-3 py-1.5 text-slate-100 hover:text-emerald-300">Leaderboard</Link>
          <Link href="/about" className="rounded-full bg-slate-800 px-3 py-1.5 text-slate-100 hover:text-emerald-300">About Us</Link>
          <Link href="/students" className="rounded-full bg-slate-800 px-3 py-1.5 text-slate-100 hover:text-emerald-300">Students</Link>

          {loading ? (
            <span className="text-slate-400">…</span>
          ) : user ? (
            <>
              {adultLabel && <span className="text-emerald-300">{adultLabel}</span>}
              <Link href="/account" className="rounded-full bg-gradient-to-br from-amber-500 to-red-500 px-3 py-1.5 text-white">Account</Link>
            </>
          ) : accessVia === 'student' ? (
            <Link href="/students" className="rounded-full bg-emerald-600 px-3 py-1.5 text-white">Class access</Link>
          ) : (
            <Link href="/login" className="rounded-full bg-gradient-to-br from-amber-500 to-red-500 px-3 py-1.5 text-white">Log in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
