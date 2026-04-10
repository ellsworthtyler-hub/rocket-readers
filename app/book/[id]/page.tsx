// app/book/[id]/page.tsx
import { notFound } from 'next/navigation';
import { loadBooks } from '@/lib/data';
import Link from 'next/link';

interface BookPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookStatsPage({ params }: BookPageProps) {
  const { id } = await params;
  const allBooks = await loadBooks();
  const book = allBooks.find((b) => b.id === id);

  if (!book) notFound();

  // Full stats (simulated for now - we'll pull from archive later)
  const stats = {
    totalSentences: 1240,
    avgSentenceLength: 12.4,
    totalWords: 15376,
    avgWordLength: 4.2,
    uniqueWords: 3124,

    dolchPrek: 92.5,
    dolchKindergarten: 88.5,
    dolch1st: 85.4,
    dolch2nd: 78.3,
    dolch3rd: 71.2,

    posData: [
      { label: 'Nouns', percent: 42, count: 6460 },
      { label: 'Verbs', percent: 18, count: 2768 },
      { label: 'Adjectives', percent: 15, count: 2306 },
      { label: 'Adverbs', percent: 9, count: 1384 },
      { label: 'Pronouns', percent: 8, count: 1230 },
      { label: 'Prepositions', percent: 5, count: 769 },
      { label: 'Conjunctions', percent: 3, count: 461 },
    ],

    wordLengths: {
      len03: 1240, len04: 980, len05: 1450, len06: 1320, len07: 980,
      len08: 760, len09: 650, len10: 540, len11: 420, len12: 310,
      len13: 240, len14: 180, len15: 110,
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link href="/search" className="text-emerald-600 hover:underline mb-8 inline-block">
        ← Back to Library
      </Link>

      {/* Title & Author */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900">{book.title}</h1>
        {book.author && <p className="text-slate-600 text-xl mt-2">{book.author}</p>}
      </div>

      {/* The Big 4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
          <div className="text-sm text-emerald-600 font-medium">Dolch Density</div>
          <div className="text-5xl font-bold text-emerald-700 mt-2">{book.dolch}%</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
          <div className="text-sm text-amber-600 font-medium">Fry Density</div>
          <div className="text-5xl font-bold text-amber-700 mt-2">{book.fry}%</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
          <div className="text-sm text-sky-600 font-medium">Dialogue Ratio</div>
          <div className="text-5xl font-bold text-sky-700 mt-2">{book.dialogRatio}%</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
          <div className="text-sm text-violet-600 font-medium">Flesch Grade</div>
          <div className="text-5xl font-bold text-violet-700 mt-2">{book.fleschGrade}</div>
        </div>
      </div>

      {/* Core Text Metrics + Dolch Breadth by Grade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Core Text Metrics */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100">
          <h3 className="text-xl font-semibold mb-6">Core Text Metrics</h3>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
            <div><span className="text-slate-500">Total Sentences</span><div className="font-semibold text-lg mt-1">{stats.totalSentences.toLocaleString()}</div></div>
            <div><span className="text-slate-500">Avg Sentence Length</span><div className="font-semibold text-lg mt-1">{stats.avgSentenceLength}</div></div>
            <div><span className="text-slate-500">Total Words</span><div className="font-semibold text-lg mt-1">{stats.totalWords.toLocaleString()}</div></div>
            <div><span className="text-slate-500">Avg Word Length</span><div className="font-semibold text-lg mt-1">{stats.avgWordLength}</div></div>
            <div><span className="text-slate-500">Unique Words</span><div className="font-semibold text-lg mt-1">{stats.uniqueWords.toLocaleString()}</div></div>
          </div>
        </div>

        {/* Dolch Breadth by Grade */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100">
          <h3 className="text-xl font-semibold mb-6">Dolch Sight Word Breadth by Grade</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between"><span>Pre-K</span><span className="font-medium">{stats.dolchPrek}%</span></div>
            <div className="flex justify-between"><span>Kindergarten</span><span className="font-medium">{stats.dolchKindergarten}%</span></div>
            <div className="flex justify-between"><span>1st Grade</span><span className="font-medium">{stats.dolch1st}%</span></div>
            <div className="flex justify-between"><span>2nd Grade</span><span className="font-medium">{stats.dolch2nd}%</span></div>
            <div className="flex justify-between"><span>3rd Grade</span><span className="font-medium">{stats.dolch3rd}%</span></div>
          </div>
        </div>
      </div>

      {/* Part of Speech Breakdown + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* POS Table */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100">
          <h3 className="text-xl font-semibold mb-6">Part of Speech Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium text-slate-600">Part of Speech</th>
                  <th className="text-right py-3 font-medium text-slate-600">Count</th>
                  <th className="text-right py-3 font-medium text-slate-600">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {stats.posData.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-4 font-medium">{item.label}</td>
                    <td className="py-4 text-right text-slate-700">{item.count.toLocaleString()}</td>
                    <td className="py-4 text-right font-semibold text-emerald-700">{item.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie Chart Placeholder - we'll make this a real chart later if needed */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Part of Speech Distribution</h3>
            <p className="text-slate-500">Pie chart coming in next update (visual version of the table above)</p>
          </div>
        </div>
      </div>

      {/* Word Length Bar Chart - Full Width at Bottom */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100">
        <h3 className="text-xl font-semibold mb-6">Word Length Distribution (3–15 letters)</h3>
        <div className="h-80 flex items-end gap-1 pt-8">
          {Object.entries(stats.wordLengths).map(([key, count]) => {
            const length = parseInt(key.replace('len', ''));
            const height = Math.max(12, (count / 1600) * 100);
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-emerald-500 rounded-t transition-all group-hover:bg-emerald-600" 
                  style={{ height: `${height}px` }}
                />
                <div className="text-xs text-slate-500 font-medium">{length}</div>
                <div className="text-[10px] text-slate-400">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-12 text-center">
        <a 
          href={`/analyze/${book.id}`} 
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-10 py-4 rounded-3xl transition text-lg"
        >
          Generate Enhanced Rocket Reader Version →
        </a>
      </div>
    </div>
  );
}