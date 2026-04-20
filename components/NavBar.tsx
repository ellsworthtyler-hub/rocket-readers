//  FILE:  components/NavBar.tsx
//  =============================

'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function NavBar() {
  const { user, isPremium, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="bg-black text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
          🚀 Rocket Readers
        </Link>

        {/* Main links */}
        <div className="flex items-center gap-8 text-sm">
          <Link href="/" className="hover:text-emerald-400 transition">Home</Link>
		  <Link href="/about" className="hover:text-emerald-400 transition">About Us</Link>
          <Link href="/leaderboard" className="hover:text-emerald-400 transition">Leaderboard</Link>
          <Link href="/search" className="hover:text-emerald-400 transition">Search Library</Link>
        </div>

        {/* Auth section */}
        <div className="flex items-center gap-4">
          {!loading && (
            user ? (
              isPremium ? (
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-3xl font-medium">Premium ✅</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm hover:text-red-400 transition"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link
                    href="/premium"
                    className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-3xl text-sm font-medium transition"
                  >
                    Upgrade to Premium
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-slate-400 hover:text-red-400 transition"
                  >
                    Log out
                  </button>
                </div>
              )
            ) : (
              // UPGRADE: This now links to our beautiful dedicated login page!
              <Link
                href="/login"
                className="bg-white text-black hover:bg-slate-200 px-6 py-2 rounded-3xl text-sm font-bold transition shadow-sm"
              >
                Sign In
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}