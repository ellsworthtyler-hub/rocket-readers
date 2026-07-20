//  FILE:  app/book/[id]/page.tsx
//  URL id = public Gutenberg source_id; stats from rr_book_metadata

import BookActions from '@/components/ui/BookActions';
import BookFeedback from '@/components/ui/BookFeedback';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BadgeLegend } from '@/components/BadgeLegend';
import {
  getAllMetricSamples,
  getBookMetadataForSourceId,
} from '@/lib/data';

function calcPercentiles(data: any[], key: string) {
  if (!data || data.length === 0) return { p50: 0, p70: 0, p90: 0, p95: 0 };
  const vals = data
    .map((d) => parseFloat(d[key] || 0))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
  const len = vals.length;
  return {
    p50: vals[Math.floor(len * 0.5)] || 0,
    p70: vals[Math.floor(len * 0.7)] || 0,
    p90: vals[Math.floor(len * 0.9)] || 0,
    p95: vals[Math.floor(len * 0.95)] || 0,
  };
}

function getDynamicEmoticon(
  value: number,
  thresholds: { p50: number; p70: number; p90: number; p95: number }
) {
  if (value >= thresholds.p95) return '💎';
  if (value >= thresholds.p90) return '🚀';
  if (value >= thresholds.p70) return '🔥';
  if (value >= thresholds.p50) return '✅';
  return '';
}

function gradeEmoticon(value: number, samples: number[]) {
  if (!samples.length || !value) return '';
  const sorted = [...samples].sort((a, b) => a - b);
  const pctRank = sorted.filter((v) => v <= value).length / sorted.length;
  // Lower grade = better → lower pctRank is better
  if (pctRank <= 0.05) return '💎';
  if (pctRank <= 0.1) return '🚀';
  if (pctRank <= 0.3) return '🔥';
  if (pctRank <= 0.5) return '✅';
  return '';
}

function breadthPct(val: number | null | undefined) {
  return Math.min(100, Math.max(0, Math.round(Number(val) || 0)));
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const sourceId = resolvedParams.id;

  if (!/^\d{1,10}$/.test(sourceId)) {
    notFound();
  }

  const meta = await getBookMetadataForSourceId(sourceId);
  if (!meta) {
    notFound();
  }

  // Require at least some processing for full dashboard; still show shell if book exists
  const allBooks = await getAllMetricSamples();
  const thresholds = {
    dolch: calcPercentiles(allBooks, 'dolch_percentage'),
    fry: calcPercentiles(allBooks, 'fry_percentage'),
    dialog: calcPercentiles(allBooks, 'dialog_percentage'),
  };
  const gradeSamples = allBooks
    .map((d) => parseFloat(String(d.flesch_grade || 0)))
    .filter((n) => !isNaN(n) && n > 0);

  const dolchNum = parseFloat(String(meta.dolch_percentage || 0));
  const fryNum = parseFloat(String(meta.fry_percentage || 0));
  const dialogNum = parseFloat(String(meta.dialog_percentage || 0));
  const fleschEaseNum = parseFloat(String(meta.flesch_reading_ease || 0));
  const fleschGradeNum = parseFloat(String(meta.flesch_grade || 0));

  const nouns = meta.count_nouns || 0;
  const verbs = meta.count_verbs || 0;
  const adjs = meta.count_adjectives || 0;
  const advs = meta.count_adverbs || 0;
  const preps = meta.count_prepositions || 0;
  const totalPos = nouns + verbs + adjs + advs + preps || 1;

  const lengths = [
    { label: '3', val: Number(meta.len_3) || 0 },
    { label: '4', val: Number(meta.len_4) || 0 },
    { label: '5', val: Number(meta.len_5) || 0 },
    { label: '6', val: Number(meta.len_6) || 0 },
    { label: '7', val: Number(meta.len_7) || 0 },
    { label: '8', val: Number(meta.len_8) || 0 },
    { label: '9', val: Number(meta.len_9) || 0 },
    {
      label: '10+',
      val:
        (Number(meta.len_10) || 0) +
        (Number(meta.len_11) || 0) +
        (Number(meta.len_12) || 0) +
        (Number(meta.len_13) || 0) +
        (Number(meta.len_14) || 0) +
        (Number(meta.len_15_plus) || 0),
    },
  ];
  const maxLength = Math.max(...lengths.map((l) => l.val), 1);

  const dolchLevels: [string, number, number | null][] = [
    ['Pre-K', breadthPct(meta.dolch_prek_breadth), meta.dolch_prek_unique],
    ['Kindergarten', breadthPct(meta.dolch_kinder_breadth), meta.dolch_kinder_unique],
    ['1st Grade', breadthPct(meta.dolch_1st_breadth), meta.dolch_1st_unique],
    ['2nd Grade', breadthPct(meta.dolch_2nd_breadth), meta.dolch_2nd_unique],
    ['3rd Grade', breadthPct(meta.dolch_3rd_breadth), meta.dolch_3rd_unique],
  ];

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
        <h1 className="text-4xl font-bold text-slate-900 mb-2">{meta.title}</h1>
        <p className="text-lg text-slate-500 mb-8">{meta.author}</p>

        <BadgeLegend />

        {/* Hero stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-emerald-200 rounded-2xl p-4 text-center border border-emerald-100 shadow-sm relative group">
            <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">
              Dolch Density
            </div>
            <div className="text-3xl font-bold text-emerald-800">
              {dolchNum.toFixed(1)}% {getDynamicEmoticon(dolchNum, thresholds.dolch)}
            </div>
            <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              Top 10% is &ge; {thresholds.dolch.p90.toFixed(1)}%
            </div>
          </div>

          <div className="bg-amber-200 rounded-2xl p-4 text-center border border-amber-100 shadow-sm relative group">
            <div className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">
              Fry Density
            </div>
            <div className="text-3xl font-bold text-amber-800">
              {fryNum.toFixed(1)}% {getDynamicEmoticon(fryNum, thresholds.fry)}
            </div>
            <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              Top 10% is &ge; {thresholds.fry.p90.toFixed(1)}%
            </div>
          </div>

          <div className="bg-sky-200 rounded-2xl p-4 text-center border border-sky-100 shadow-sm relative group">
            <div className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1">Dialogue</div>
            <div className="text-3xl font-bold text-sky-800">
              {dialogNum.toFixed(1)}% {getDynamicEmoticon(dialogNum, thresholds.dialog)}
            </div>
            <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              Top 10% is &ge; {thresholds.dialog.p90.toFixed(1)}%
            </div>
          </div>

          <div className="bg-violet-200 rounded-2xl p-4 text-center border border-violet-100 shadow-sm relative group">
            <div className="text-xs text-violet-600 font-bold uppercase tracking-wider mb-1">
              Flesch Grade
            </div>
            <div className="text-3xl font-bold text-violet-800">
              {fleschGradeNum.toFixed(1)} {gradeEmoticon(fleschGradeNum, gradeSamples)}
            </div>
            <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              Ease score: {fleschEaseNum.toFixed(1)} (higher = easier)
            </div>
          </div>
        </div>

        <BookActions bookId={meta.sourceId} gutenbergId={meta.sourceId} />

        {!meta.last_processed && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm">
            Full analytics for this title are still processing. Gutenberg link and sample (when
            published) may still be available.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Text Composition</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Words</span>
                  <span className="font-semibold">{meta.total_words?.toLocaleString() ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Sentences</span>
                  <span className="font-semibold">
                    {meta.total_sentences?.toLocaleString() ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unique Vocabulary</span>
                  <span className="font-semibold">{meta.unique_words?.toLocaleString() ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Words / Sentence</span>
                  <span className="font-semibold">{meta.avg_sentence_length ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lexical Richness</span>
                  <span className="font-semibold">
                    {meta.word_variability_ratio != null
                      ? `${(meta.word_variability_ratio * 100).toFixed(1)}%`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Dolch Completion</h3>
              <p className="text-xs text-slate-400 mb-5">
                Share of each official list found in this book (breadth %)
              </p>

              <div className="space-y-4">
                {dolchLevels.map(([label, pct, unique]) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-600 uppercase">{label}</span>
                      <span className="text-xs font-bold text-emerald-600">
                        {pct}%
                        {unique != null ? (
                          <span className="text-slate-400 font-normal"> · {unique} unique</span>
                        ) : null}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-emerald-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
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
                <div
                  style={{ width: `${(nouns / totalPos) * 100}%` }}
                  className="bg-indigo-500 hover:opacity-80 transition"
                  title={`Nouns: ${nouns}`}
                />
                <div
                  style={{ width: `${(verbs / totalPos) * 100}%` }}
                  className="bg-rose-500 hover:opacity-80 transition"
                  title={`Verbs: ${verbs}`}
                />
                <div
                  style={{ width: `${(adjs / totalPos) * 100}%` }}
                  className="bg-amber-500 hover:opacity-80 transition"
                  title={`Adjectives: ${adjs}`}
                />
                <div
                  style={{ width: `${(advs / totalPos) * 100}%` }}
                  className="bg-sky-500 hover:opacity-80 transition"
                  title={`Adverbs: ${advs}`}
                />
                <div
                  style={{ width: `${(preps / totalPos) * 100}%` }}
                  className="bg-emerald-500 hover:opacity-80 transition"
                  title={`Prepositions: ${preps}`}
                />
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-slate-600">
                    Nouns ({((nouns / totalPos) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-slate-600">
                    Verbs ({((verbs / totalPos) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-slate-600">
                    Adjectives ({((adjs / totalPos) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-sky-500" />
                  <span className="text-slate-600">
                    Adverbs ({((advs / totalPos) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">
                    Prepositions ({((preps / totalPos) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Word Length Distribution</h3>
              <div className="h-48 flex items-end gap-2 mt-4">
                {lengths.map((item) => {
                  const heightPct = Math.max((item.val / maxLength) * 100, 1);
                  return (
                    <div
                      key={item.label}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      <span className="text-[10px] text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.val}
                      </span>
                      <div
                        className="w-full bg-violet-400 group-hover:bg-violet-800 rounded-t-sm transition-all"
                        style={{ height: `${heightPct}%`, minHeight: '4px' }}
                      />
                      <span className="text-xs text-slate-600 mt-2">{item.label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-xs text-slate-600 mt-2">Number of Letters</p>
            </div>
          </div>
        </div>

        <BookFeedback bookId={meta.sourceId} />
      </div>
    </main>
  );
}
