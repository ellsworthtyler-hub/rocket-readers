//  FILE: app/book/[id]/page.tsx
//  =============================

import { supabase } from '@/lib/supabaseClient';
import BookActions from '@/components/ui/BookActions';
import BookFeedback from '@/components/ui/BookFeedback';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Helper to find exact database percentiles
function calcPercentiles(data: any[], key: string) {
  if (!data || data.length === 0) return { p50: 0, p70: 0, p90: 0 };
  const vals = data.map(d => parseFloat(d[key] || 0)).filter(n => !isNaN(n)).sort((a, b) => a - b);
  const len = vals.length;
  return {
    p50: vals[Math.floor(len * 0.50)], 
    p70: vals[Math.floor(len * 0.70)], 
    p90: vals[Math.floor(len * 0.90)], 
  };
}

function getDynamicEmoticon(value: number, thresholds: { p50: number, p70: number, p90: number }) {
  if (value >= thresholds.p90) return '🚀';
  if (value >= thresholds.p70) return '🔥';
  if (value >= thresholds.p50) return '✅';
  return ''; 
}

export default async function BookPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const bookId = parseInt(resolvedParams.id, 10);
  
  // 1. Fetch Target Book Metadata
  const { data: metaData, error: metaError } = await supabase
    .from('book_metadata')
    .select('*, gutenberg_catalog(*)')
    .eq('book_id', bookId) 
    .single();

  // TEMPORARY DEBUG BLOCK:
  if (metaError || !metaData) {
    return (
      <div className="p-12 text-left bg-white min-h-screen">
        <h1 className="text-3xl font-bold text-red-600 mb-4">🚨 Supabase Blocked the Request</h1>
        <p className="mb-4 text-slate-600">We searched for Book ID: <strong>{bookId}</strong></p>
        <div className="bg-slate-900 text-green-400 p-6 rounded-xl overflow-x-auto">
          <pre>Error Details: {JSON.stringify(metaError, null, 2)}</pre>
        </div>
      </div>
    );
  }

  // 2. Fetch Global Stats for Percentiles
  const { data: allBooks } = await supabase
    .from('book_metadata')
    .select('dolch_percentage, fry_percentage, dialog_percentage, flesch_reading_ease');

  const thresholds = {
    dolch: calcPercentiles(allBooks || [], 'dolch_percentage'),
    fry: calcPercentiles(allBooks || [], 'fry_percentage'),
    dialog: calcPercentiles(allBooks || [], 'dialog_percentage'),
    flesch: calcPercentiles(allBooks || [], 'flesch_reading_ease')
  };

  const dolchNum = parseFloat(metaData.dolch_percentage || 0);
  const fryNum = parseFloat(metaData.fry_percentage || 0);
  const dialogNum = parseFloat(metaData.dialog_percentage || 0);
  const fleschNum = parseFloat(metaData.flesch_reading_ease || 0);

  const nouns = metaData.count_nouns || 0;
  const verbs = metaData.count_verbs || 0;
  const adjs = metaData.count_adjectives || 0;
  const advs = metaData.count_adverbs || 0;
  const preps = metaData.count_prepositions || 0;
  const totalPos = nouns + verbs + adjs + advs + preps || 1; 

  const lengths = [
    { label: '3', val: Number(metaData.len_3) || 0 },
    { label: '4', val: Number(metaData.len_4) || 0 },
    { label: '5', val: Number(metaData.len_5) || 0 },
    { label: '6', val: Number(metaData.len_6) || 0 },
    { label: '7', val: Number(metaData.len_7) || 0 },
    { label: '8', val: Number(metaData.len_8) || 0 },
    { label: '9', val: Number(metaData.len_9) || 0 },
    { label: '10+', val: (Number(metaData.len_10) || 0) + (Number(metaData.len_11) || 0) + (Number(metaData.len_12) || 0) + (Number(metaData.len_13) || 0) + (Number(metaData.len_14) || 0) + (Number(metaData.len_15_plus) || 0) }
  ];
  const maxLength = Math.max(...lengths.map(l => l.val), 1);

  const DOLCH_MAX = { prek: 40, kinder: 52, first: 41, second: 46, third: 41 };
  const getDolchPct = (count: number, max: number) => Math.min(100, Math.round((count / max) * 100));

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/search" className="text-emerald-600 font-bold hover:text-emerald-700 transition">
            ← Back to Library
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          {metaData.gutenberg_catalog?.title || "Unknown Title"}
        </h1>
        <p className="text-lg text-slate-500 mb-8">
          {metaData.gutenberg_catalog?.author || "Unknown Author"}
        </p>

        {/* TOP 4 HERO STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-emerald-200 rounded-2xl p-4 text-center border border-emerald-100 shadow-sm relative group">
            <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Dolch Density</div>
            <div className="text-3xl font-bold text-emerald-800">{dolchNum.toFixed(1)}% {getDynamicEmoticon(dolchNum, thresholds.dolch)}</div>
            <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              Top 10% is &ge; {thresholds.dolch.p90.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-amber-200 rounded-2xl p-4 text-center border border-amber-100 shadow-sm relative group">
            <div className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Fry Density</div>
            <div className="text-3xl font-bold text-amber-800">{fryNum.toFixed(1)}% {getDynamicEmoticon(fryNum, thresholds.fry)}</div>
            <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              Top 10% is &ge; {thresholds.fry.p90.toFixed(1)}%
            </div>
          </div>

          <div className="bg-sky-200 rounded-2xl p-4 text-center border border-sky-100 shadow-sm relative group">
            <div className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1">Dialogue</div>
            <div className="text-3xl font-bold text-sky-800">{dialogNum.toFixed(1)}% {getDynamicEmoticon(dialogNum, thresholds.dialog)}</div>
             <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              Top 10% is &ge; {thresholds.dialog.p90.toFixed(1)}%
            </div>
          </div>

          <div className="bg-violet-200 rounded-2xl p-4 text-center border border-violet-100 shadow-sm relative group">
            <div className="text-xs text-violet-600 font-bold uppercase tracking-wider mb-1">Flesch Ease</div>
            <div className="text-3xl font-bold text-violet-800">{fleschNum.toFixed(1)} {getDynamicEmoticon(fleschNum, thresholds.flesch)}</div>
             <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              Top 10% is &ge; {thresholds.flesch.p90.toFixed(1)}
            </div>
          </div>
        </div>
		
		{/* THE NEW ACTION BAR */}
        <BookActions 
          bookId={bookId} 
          gutenbergId={metaData.gutenberg_catalog?.id || bookId} 
        />
		
        {/* DEEP ANALYTICS DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Text Composition</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-slate-500">Total Words</span><span className="font-semibold">{metaData.total_words?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Sentences</span><span className="font-semibold">{metaData.total_sentences?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Unique Vocabulary</span><span className="font-semibold">{metaData.unique_words?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Words / Sentence</span><span className="font-semibold">{metaData.avg_sentence_length}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Lexical Richness</span><span className="font-semibold">{(metaData.word_variability_ratio * 100).toFixed(1)}%</span></div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Dolch Completion</h3>
              <p className="text-xs text-slate-400 mb-5">Percentage of standard list found in text</p>
              
              <div className="space-y-4">
                {Object.entries({
                  'Pre-K': [metaData.dolch_prek_breadth, DOLCH_MAX.prek],
                  'Kindergarten': [metaData.dolch_kinder_breadth, DOLCH_MAX.kinder],
                  '1st Grade': [metaData.dolch_1st_breadth, DOLCH_MAX.first],
                  '2nd Grade': [metaData.dolch_2nd_breadth, DOLCH_MAX.second],
                  '3rd Grade': [metaData.dolch_3rd_breadth, DOLCH_MAX.third],
                }).map(([label, [val, max]]) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-600 uppercase">{label}</span>
                      <span className="text-xs font-bold text-emerald-600">{getDolchPct(val, max)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-emerald-400 h-1.5 rounded-full transition-all" style={{ width: `${getDolchPct(val, max)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Grammatical Breakdown (POS)</h3>
              <div className="h-8 w-full flex rounded-full overflow-hidden mb-4">
                <div style={{ width: `${(nouns / totalPos) * 100}%` }} className="bg-indigo-500 hover:opacity-80 transition" title={`Nouns: ${nouns}`}></div>
                <div style={{ width: `${(verbs / totalPos) * 100}%` }} className="bg-rose-500 hover:opacity-80 transition" title={`Verbs: ${verbs}`}></div>
                <div style={{ width: `${(adjs / totalPos) * 100}%` }} className="bg-amber-500 hover:opacity-80 transition" title={`Adjectives: ${adjs}`}></div>
                <div style={{ width: `${(advs / totalPos) * 100}%` }} className="bg-sky-500 hover:opacity-80 transition" title={`Adverbs: ${advs}`}></div>
                <div style={{ width: `${(preps / totalPos) * 100}%` }} className="bg-emerald-500 hover:opacity-80 transition" title={`Prepositions: ${preps}`}></div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-slate-600">Nouns ({(nouns/totalPos*100).toFixed(1)}%)</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-slate-600">Verbs ({(verbs/totalPos*100).toFixed(1)}%)</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-slate-600">Adjectives ({(adjs/totalPos*100).toFixed(1)}%)</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-sky-500"></div><span className="text-slate-600">Adverbs ({(advs/totalPos*100).toFixed(1)}%)</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-slate-600">Prepositions ({(preps/totalPos*100).toFixed(1)}%)</span></div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Word Length Distribution</h3>
              <div className="h-48 flex items-end gap-2 mt-4">
                {lengths.map((item) => {
                  const heightPct = Math.max((item.val / maxLength) * 100, 1);
                  return (
                    <div key={item.label} className="flex-1 flex flex-col items-center justify-end h-full group">
                      <span className="text-[10px] text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.val}
                      </span>
                      <div className="w-full bg-violet-400 group-hover:bg-violet-800 rounded-t-sm transition-all" style={{ height: `${heightPct}%`, minHeight: '4px' }}></div>
                      <span className="text-xs text-slate-600 mt-2">{item.label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-xs text-slate-600 mt-2">Number of Letters</p>
            </div>
          </div>
        </div>

        {/* THE COMMUNITY MODERATION SYSTEM */}
        <BookFeedback bookId={bookId} />

      </div>
    </main>
  );
}