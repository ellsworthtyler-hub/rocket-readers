// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rocket Reader',
  description: 'Find books with the highest sight-word coverage',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* Top Navigation Bar (restored) */}
          <nav className="bg-black text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              <span className="text-2xl font-bold tracking-tight">Rocket Readers</span>
            </div>
            <div className="flex items-center gap-8 text-sm font-medium">
              <a href="/" className="hover:text-emerald-400 transition">Home</a>
              <a href="/leaderboard" className="hover:text-emerald-400 transition">Leaderboard</a>
              <a href="/about" className="hover:text-emerald-400 transition">About</a>
              <a href="/search" className="hover:text-emerald-400 transition">Search Library</a>
              <a href="/premium" className="hover:text-emerald-400 transition">Analyze Any Book</a>
            </div>
          </nav>

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}