// components/NavBar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { isCalmPath } from '@/lib/theme';

export default function NavBar() {
  const { user, isPremium } = useAuth();
  const pathname = usePathname();
  const calm = isCalmPath(pathname);

  const linkBase = calm
    ? 'px-3 py-1.5 rounded-full text-sm font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition'
    : 'px-3 py-1.5 rounded-full text-sm font-bold text-slate-200 bg-slate-800 border-2 border-transparent hover:border-emerald-400 hover:text-emerald-300 transition';

  const linkActive = calm
    ? 'px-3 py-1.5 rounded-full text-sm font-semibold text-emerald-800 bg-emerald-100'
    : 'px-3 py-1.5 rounded-full text-sm font-bold text-amber-200 bg-stone-800 border-2 border-amber-400';

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <nav
      className={
        calm
          ? 'sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm'
          : 'sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b-[3px] border-amber-400'
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-3">
        <Link
          href="/"
          className={
            calm
              ? 'font-bold text-xl text-emerald-700 flex items-center gap-1.5'
              : 'font-display font-bold text-xl text-white flex items-center gap-1.5'
          }
        >
          <span className="text-2xl" aria-hidden>
            🚀
          </span>
          Rocket Readers
        </Link>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
          <Link href="/search" className={isActive('/search') ? linkActive : linkBase}>
            Search
          </Link>
          <Link
            href="/leaderboard"
            className={`${isActive('/leaderboard') ? linkActive : linkBase} hidden sm:inline-flex`}
          >
            Leaderboard
          </Link>
          <Link href="/about" className={isActive('/about') ? linkActive : linkBase}>
            About Us
          </Link>

          {user ? (
            <>
              {isPremium && (
                <span
                  className={
                    calm
                      ? 'text-emerald-600 font-semibold text-xs sm:text-sm hidden md:inline'
                      : 'bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-full font-bold hidden md:inline'
                  }
                >
                  Premium
                </span>
              )}
              <Link
                href="/premium"
                className={
                  calm
                    ? isActive('/premium')
                      ? linkActive
                      : 'px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'px-3 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-red-500 border-0'
                }
              >
                Account
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className={
                calm
                  ? 'px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'px-3 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-red-500'
              }
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
