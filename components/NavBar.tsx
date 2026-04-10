// components/NavBar.tsx
'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/data';

export default function NavBar() {
  const { user, isPremium } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="bg-black text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🚀</span>
        <span className="text-2xl font-bold tracking-tight">Rocket Readers</span>
      </div>

      <div className="flex items-center gap-8 text-sm font-medium">
        <Link href="/" className="hover:text-emerald-400 transition">Home</Link>
        <Link href="/leaderboard" className="hover:text-emerald-400 transition">Leaderboard</Link>
        <Link href="/about" className="hover:text-emerald-400 transition">About</Link>
        <Link href="/search" className="hover:text-emerald-400 transition">Search Library</Link>
        
        {user ? (
          <>
            {isPremium && <span className="text-emerald-400 text-xs font-bold">PREMIUM</span>}
            <button onClick={handleLogout} className="hover:text-emerald-400 transition">Log out</button>
          </>
        ) : (
          <Link href="/premium" className="hover:text-emerald-400 transition">Sign in / Upgrade</Link>
        )}
      </div>
    </nav>
  );
}