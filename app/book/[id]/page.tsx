// app/book/[id]/page.tsx
import { getBookById } from "@/lib/data";
import POSPieChart from "@/components/POSPieChart";
import WordLengthChart from "@/components/WordLengthChart";
import RocketReader from "@/components/RocketReader";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;           // ← this fixes the error
  const book = await getBookById(id);

  if (!book) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl font-bold text-white">Book not found</h1>
        <p className="text-slate-400 mt-4">ID: {id}</p>
        <p className="text-emerald-300 mt-8">Check the terminal for debug logs</p>
      </div>
    );
  }

  // Emoticon logic exactly as you requested in the PDF
  const getEmoticon = (value: string | number, type: "dolch" | "fry" | "flesch" | "dialog") => {
    const num = parseFloat(String(value));
    if (isNaN(num)) return "";
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Centered Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white">{book.title}</h1>
        <p className="text-2xl text-emerald-300 mt-2">{book.author}</p>
        <p className="text-slate-400 mt-1">Gutenberg Archive Book #{book.id}</p>
      </div>

      {/* Expanded Stats Grid - matches your PDF mockup */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white/5 p-6 rounded-3xl flex items-center gap-4">
          <div className="text-emerald-400 text-4xl">{getEmoticon(book.dolchBreadth, "dolch")}</div>
          <div>
            <p className="text-xs text-slate-400">DOLCH BREADTH %</p>
            <p className="text-3xl font-bold">{book.dolchBreadth}</p>
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-3xl flex items-center gap-4">
          <div className="text-amber-400 text-4xl">{getEmoticon(book.frySight, "fry")}</div>
          <div>
            <p className="text-xs text-slate-400">FRY SIGHT WORD %</p>
            <p className="text-3xl font-bold">{book.frySight}</p>
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-3xl flex items-center gap-4">
          <div className="text-emerald-400 text-4xl">{getEmoticon(book.fleschGrade, "flesch")}</div>
          <div>
            <p className="text-xs text-slate-400">FLESCH GRADE SCORE</p>
            <p className="text-3xl font-bold">{book.fleschGrade}</p>
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-3xl flex items-center gap-4">
          <div className="text-emerald-400 text-4xl">{getEmoticon(book.dialogRatio, "dialog")}</div>
          <div>
            <p className="text-xs text-slate-400">DIALOG RATIO</p>
            <p className="text-3xl font-bold">{book.dialogRatio}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Parts of Speech Breakdown</h2>
          <POSPieChart />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Word Length Distribution</h2>
          <WordLengthChart />
        </div>
      </div>

      {/* Interactive Rocket Reader */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Interactive Rocket Reader</h2>
        <RocketReader html="<p>Interactive reader loading... (full HTML coming soon)</p>" />
      </div>
    </div>
  );
}
