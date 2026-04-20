//  FILE:  components/ui/Rocketreader.tsx
//  =======================================

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function RocketReader({ metadata, sentences, tokens, bookId, currentPage, totalPages }: any) {
  // 1. Pull in the global auth state
  const { user, isPremium, loading } = useAuth();
  
  const [posActive, setPosActive] = useState({
    nouns: false,
    verbs: false,
    adjectives: false,
    adverbs: false,
    prepositions: false
  });

  const togglePos = (type: keyof typeof posActive) => {
    setPosActive(prev => ({ ...prev, [type]: !prev[type] }));
  };
  const [showDolch, setShowDolch] = useState(false);
  const [showFry, setShowFry] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  const tokenMap = useMemo(() => {
    const map = new Map();
    (tokens || []).forEach((t: any) => {
      if (!map.has(t.sentence_index)) map.set(t.sentence_index, []);
      map.get(t.sentence_index).push(t);
    });
    return map;
  }, [tokens]);

 const getPosStyle = (pos: string) => {
    switch(pos) {
      case 'NOUN': case 'PROPN': 
        return posActive.nouns ? 'text-indigo-600 underline decoration-indigo-300 decoration-2 underline-offset-2' : '';
      case 'VERB': case 'AUX': 
        return posActive.verbs ? 'text-rose-600 underline decoration-rose-300 decoration-2 underline-offset-2' : '';
      case 'ADJ': 
        return posActive.adjectives ? 'text-amber-600 underline decoration-amber-300 decoration-2 underline-offset-2' : '';
      case 'ADV': 
        return posActive.adverbs ? 'text-sky-600 underline decoration-sky-300 decoration-2 underline-offset-2' : '';
      case 'ADP': 
        return posActive.prepositions ? 'text-emerald-600 underline decoration-emerald-300 decoration-2 underline-offset-2' : '';
      default: return '';
    }
  };

  const getBgStyle = (isDolch: boolean, isFry: boolean) => {
    if (showDolch && isDolch) return 'bg-green-200/80 rounded-sm px-0.5';
    if (showFry && isFry) return 'bg-purple-200/80 rounded-sm px-0.5';
    return '';
  };

  const needsLeadingSpace = (word: string, index: number) => {
    if (index === 0) return false;
    if (/^[.,!?;:\])“"’']/.test(word)) return false;
    return true;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 2. The Loading State (prevents flashing the lock screen while Supabase checks status)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-400 w-full h-full min-h-[50vh]">
        <div className="animate-pulse text-lg font-semibold tracking-widest uppercase">Loading Reader...</div>
      </div>
    );
  }

  // 3. THE PREMIUM GUARD (The impenetrable wall)
  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center p-12 md:p-24 text-center bg-white rounded-3xl w-full h-full min-h-[60vh]">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Premium Edition</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          This enhanced interactive text is available exclusively to Rocket Reader Premium members.
        </p>
        <Link 
          href="/premium" 
          className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition shadow-md"
        >
          Unlock Premium Access
        </Link>
        {!user && (
          <p className="mt-4 text-sm text-slate-400">
            Already a member? <Link href="/premium" className="underline hover:text-slate-600">Sign in</Link>
          </p>
        )}
      </div>
    );
  }

  // 4. If they pass the check, render the actual book
  return (
    <div className="relative bg-white w-full h-full flex flex-col rounded-3xl pb-24">
      
      {/* THE FLOATING BOTTOM DOCK */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2 md:p-3 rounded-full shadow-2xl flex flex-wrap items-center justify-center gap-2 md:gap-4 w-max max-w-[95vw]">
        {/* GRAMMAR TOGGLES */}
		<div className="flex items-center gap-1 bg-slate-800 p-1 rounded-full border border-slate-700">
		  <button onClick={() => togglePos('nouns')} className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${posActive.nouns ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>
			Nouns
		  </button>
		  <button onClick={() => togglePos('verbs')} className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${posActive.verbs ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}>
			Verbs
		  </button>
		  <button onClick={() => togglePos('adjectives')} className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${posActive.adjectives ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'}`}>
			Adjectives
		  </button>
		  <button onClick={() => togglePos('adverbs')} className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${posActive.adverbs ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}>
			Adverbs
		  </button>
		  <button onClick={() => togglePos('prepositions')} className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${posActive.prepositions ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}>
			Prepositions
		  </button>
		</div>
        <button onClick={() => setShowDolch(!showDolch)} className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${showDolch ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
          {showDolch ? '✓ Dolch' : 'Dolch'}
        </button>
        <button onClick={() => setShowFry(!showFry)} className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${showFry ? 'bg-purple-500 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
          {showFry ? '✓ Fry' : 'Fry'}
        </button>

        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-full border border-slate-700 ml-1">
          <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full hover:bg-slate-600 font-bold text-white transition text-xs">A-</button>
          <button onClick={() => setFontSize(f => Math.min(36, f + 2))} className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full hover:bg-slate-600 font-bold text-white transition text-xs">A+</button>
        </div>

        <button onClick={scrollToTop} className="ml-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 hover:text-white transition flex items-center gap-1 text-xs md:text-sm font-bold border border-slate-700">
          ↑ Top
        </button>
      </div>

      <div className="p-8 md:p-12 max-w-4xl mx-auto w-full">
        <div className="mb-10 border-b border-slate-200 pb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">
            {metadata?.gutenberg_catalog?.title || `Book ${metadata?.book_id}`}
          </h1>
          <h2 className="text-xl text-slate-500 font-medium">
            {metadata?.gutenberg_catalog?.author || 'Unknown Author'}
          </h2>
          {/* Chapter Subtitle */}
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-4">
            Chapter {currentPage} of {totalPages}
          </p>
        </div>

        <div className="whitespace-pre-wrap text-slate-800 transition-all duration-200" style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}>
          {sentences.map((sent: any, sIdx: number) => {
             const sTokens = tokenMap.get(sent.sentence_index) || [];
             const hasParagraphBreak = sent.sentence_text.includes('\n');
             
             if (sTokens.length > 0) {
                return (
                  <span key={sIdx}>
                    {sTokens.map((t: any, tIdx: number) => {
                       const posClass = getPosStyle(t.pos);
                       const bgClass = getBgStyle(t.dolch_grade !== null, t.is_fry);
                       return (
                         <span key={tIdx}>
                            {needsLeadingSpace(t.word_original, tIdx) ? ' ' : ''}
                            <span className={`${posClass} ${bgClass} transition-colors duration-300`}>{t.word_original}</span>
                         </span>
                       )
                    })}
                    {hasParagraphBreak ? '\n\n' : ' '}
                  </span>
                )
             } else {
                return <span key={sIdx}>{sent.sentence_text}{hasParagraphBreak ? '\n\n' : ' '}</span>;
             }
          })}
        </div>
        
        {/* The Pagination Controls */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-8 gap-4">
          
          {currentPage > 1 ? (
            <Link 
              href={`/read/${bookId}?page=${currentPage - 1}#reader-top`} 
              className="px-6 py-3 bg-white border border-slate-300 rounded-full font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition shadow-sm w-full sm:w-auto text-center"
            >
              ← Previous Chapter
            </Link>
          ) : <div className="w-[180px] hidden sm:block" />}

          <span className="text-slate-400 font-medium text-sm">
            Page {currentPage} of {totalPages}
          </span>

          {currentPage < totalPages ? (
            <Link 
              href={`/read/${bookId}?page=${currentPage + 1}#reader-top`} 
              className="px-6 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition shadow-md w-full sm:w-auto text-center"
            >
              Next Chapter →
            </Link>
          ) : (
            <div className="px-6 py-3 bg-slate-100 text-slate-400 rounded-full font-bold w-full sm:w-auto text-center">
              End of Book
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}