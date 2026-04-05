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
        <nav className="border-b border-slate-800 bg-slate-950 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="w-8 h-8 text-emerald-400" />
              <span className="text-2xl font-bold tracking-tighter">Rocket Readers</span>
            </div>
            <div className="flex gap-8 text-sm font-medium">
              <a href="/" className="hover:text-emerald-400">Home</a>
              <a href="/leaderboard" className="hover:text-emerald-400">Leaderboard</a>
              <a href="/about" className="hover:text-emerald-400">About</a>
              <a href="/search" className="hover:text-emerald-400">Search Library</a>
              <a href="/analyze" className="hover:text-emerald-400">Analyze Any Book</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}