//  FILE:  components/ui/BookActions.tsx
//  =======================================

'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

interface BookActionsProps {
  bookId: number;
  gutenbergId: string | number;
}

export default function BookActions({ bookId, gutenbergId }: BookActionsProps) {
  const { user, isPremium } = useAuth();

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-10 mt-[-10px]">
      
      {/* 1. Always Free: Gutenberg Link */}
      <a 
        href={`https://www.gutenberg.org/ebooks/${gutenbergId}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex-1 py-4 px-4 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl text-center hover:bg-slate-100 hover:border-slate-300 transition"
      >
        Get the FREE ebook here!
      </a>

      {/* 2. Premium Gated: Enhanced Ebook */}
      {isPremium ? (
        <Link 
          href={`/read/${bookId}`} 
          className="flex-[2] py-4 px-4 bg-emerald-600 text-white font-bold rounded-2xl text-center hover:bg-emerald-700 transition shadow-sm"
        >
          Read Enhanced Ebook
        </Link>
      ) : (
        <Link 
          href="/premium" 
          className="flex-[2] py-4 px-4 bg-white text-slate-400 font-bold rounded-2xl text-center border-2 border-slate-100 flex items-center justify-center gap-2 hover:bg-slate-50 transition"
        >
          <span>🔒</span> Read Enhanced Ebook
        </Link>
      )}

      {/* 3. Premium Gated: Classwork Packets */}
      {isPremium ? (
        <Link 
          href={`/packets/${bookId}`} 
          className="flex-1 py-4 px-4 bg-emerald-100 text-emerald-800 font-bold rounded-2xl text-center hover:bg-emerald-200 transition"
        >
          Download Packets
        </Link>
      ) : (
        <Link 
          href="/premium" 
          className="flex-1 py-4 px-4 bg-white text-slate-400 font-bold rounded-2xl text-center border-2 border-slate-100 flex items-center justify-center gap-2 hover:bg-slate-50 transition"
        >
          <span>🔒</span> Classwork Packets
        </Link>
      )}
    </div>
  );
}