// app/book/[id]/page.tsx
import { getBookById } from "@/lib/data";
import POSPieChart from "@/components/POSPieChart";
import WordLengthChart from "@/components/WordLengthChart";
import RocketReader from "@/components/RocketReader";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl font-bold text-white">Book not found</h1>
        <p className="text-slate-400 mt-4">ID: {id}</p>
      </div>
    );
  }

  const getEmoticon = (value: string | number, type: "dolch" | "fry" | "flesch" | "dialog") => {
    let num = parseFloat(String(value));
    if (isNaN(num)) return "";
    if (num < 1) num *= 100; // normalize decimals to percentage scale
    if (type === "dolch" || type === "fry") {
      if (num >= 90) return "🚀";
      if (num >= 70) return "🔥";
      if (num >= 50) return "✅";
    }
    if (type === "flesch") {
      if (num <= 3) return "🚀";
      if (num <= 5) return "🔥";
      if (num <= 7) return "✅";
    }
    if (type === "dialog") {
      if (num >= 80) return "🚀";
      if (num >= 60) return "🔥";
      if (num >= 40) return "✅";
    }
    return "";
  };

  const toPercent = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? "N/A" : `${(num > 1 ? num : num * 100).toFixed(1)}%`;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Big dark title */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-black text-slate-900 tracking-tight">{book.title}</h1>
        <p className="text-3xl text-emerald-600 mt-3">by {book.author}</p>
        <p className="text-slate-500 mt-2">GUTENBERG ARCHIVE BOOK #{book.id}</p>
      </div>

      {/* Stat Block – exact layout from your PDF */}
      <div className="border border-white/20 rounded-3xl p-8 mb-16 bg-white/5">
        <div className="grid grid-cols-2 gap-x-12 gap-y-8">
          {/* Top row */}
          <div className="flex justify-between border-b border-white/10 pb-6">
            <div>
              <p className="text-xs text-slate-400">Total Number of Sentences:</p>
              <p className="text-3xl font-bold text-slate-900">87</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Average Sentence Length:</p>
              <p className="text-3xl font-bold text-slate-900">14.3</p>
            </div>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-6">
            <div>
              <p className="text-xs text-slate-400">Total Number of Words:</p>
              <p className="text-3xl font-bold text-slate-900">1,248</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Average Word Length:</p>
              <p className="text-3xl font-bold text-slate-900">4.8</p>
            </div>
          </div>

          {/* Left column - Dolch by Grade */}
          <div>
            <p className="text-xs text-slate-400 mb-4">DOLCH % by Level:</p>
            <div className="space-y-4 text-lg">
              <div className="flex justify-between items-center"><span>PRE-K:</span><span className="font-bold text-3xl">92% {getEmoticon(92, "dolch")}</span></div>
              <div className="flex justify-between items-center"><span>KIND:</span><span className="font-bold text-3xl">88% {getEmoticon(88, "dolch")}</span></div>
              <div className="flex justify-between items-center"><span>1ST GRADE:</span><span className="font-bold text-3xl">85% {getEmoticon(85, "dolch")}</span></div>
              <div className="flex justify-between items-center"><span>2ND GRADE:</span><span className="font-bold text-3xl">81% {getEmoticon(81, "dolch")}</span></div>
              <div className="flex justify-between items-center"><span>3RD GRADE:</span><span className="font-bold text-3xl">78% {getEmoticon(78, "dolch")}</span></div>
            </div>
          </div>

          {/* Right column - All stats with emoticons */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">DOLCH SIGHT WORD %:</span>
              <span className="font-bold text-3xl">{toPercent(book.dolchBreadth)} {getEmoticon(book.dolchBreadth, "dolch")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">FRY SIGHT WORD %:</span>
              <span className="font-bold text-3xl">{toPercent(book.frySight)} {getEmoticon(book.frySight, "fry")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">FLESCH GRADE SCORE:</span>
              <span className="font-bold text-3xl">{book.fleschGrade} {getEmoticon(book.fleschGrade, "flesch")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">FLESCH READING EASE:</span>
              <span className="font-bold text-3xl">78.5 {getEmoticon(78.5, "flesch")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">DIALOG RATIO:</span>
              <span className="font-bold text-3xl">{toPercent(book.dialogRatio)} {getEmoticon(book.dialogRatio, "dialog")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Pie Chart */}
      <div className="flex justify-center mb-16">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-semibold mb-4 text-center">Parts of Speech Breakdown</h2>
          <POSPieChart />
        </div>
      </div>

      {/* Full-width Word Length chart at the bottom */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-4">Word Length Distribution</h2>
        <WordLengthChart />
      </div>

      {/* Interactive Rocket Reader */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Interactive Rocket Reader</h2>
        <RocketReader html="<p>Interactive reader loading... (full HTML coming soon)</p>" />
      </div>
    </div>
  );
}
