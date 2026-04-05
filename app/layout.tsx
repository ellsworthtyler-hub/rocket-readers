// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Rocket } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rocket Readers | Sight-Word Powered Reading",
  description: "Analyze any book. Boost Dolch & Fry coverage. Instant Rocket Editions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-200`}>
        {/* Updated header with bright, readable colors on all devices */}
        <nav className="border-b border-white/10 bg-slate-950 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="w-9 h-9 text-emerald-400" />
              <span className="text-3xl font-bold tracking-tighter text-white">Rocket Readers</span>
            </div>
            <div className="flex gap-8 text-base font-medium text-white">
              <a href="/" className="hover:text-emerald-400 transition">Home</a>
              <a href="/leaderboard" className="hover:text-emerald-400 transition">Leaderboard</a>
              <a href="/about" className="hover:text-emerald-400 transition">About</a>
              <a href="/search" className="hover:text-emerald-400 transition">Search Library</a>
              <a href="/analyze" className="hover:text-emerald-400 transition">Analyze Any Book</a>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}