// components/NavBar.tsx
'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function NavBar() {
  const { user, isPremium } = useAuth();

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="font-bold text-xl text-emerald-700">
          Rocket Reader
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
          <Link href="/search" className="hover:text-emerald-600">
            Search
          </Link>
          <Link href="/leaderboard" className="hover:text-emerald-600 hidden sm:inline">
            Leaderboard
          </Link>
          <Link href="/about" className="hover:text-emerald-600">
            About Us
          </Link>

          {user ? (
            <>
              {isPremium && (
                <span className="text-emerald-600 font-semibold hidden sm:inline">Premium</span>
              )}
              <Link href="/premium" className="hover:text-emerald-600">
                Account
              </Link>
            </>
          ) : (
            <Link href="/login" className="hover:text-emerald-600">
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
