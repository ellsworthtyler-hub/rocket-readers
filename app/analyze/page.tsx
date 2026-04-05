// app/analyze/page.tsx
'use client';
import { useState } from "react";
import MetricGrid from "@/components/MetricGrid";
import POSPieChart from "@/components/POSPieChart";
import WordLengthChart from "@/components/WordLengthChart";
import RocketReader from "@/components/RocketReader";

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Processing failed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-bold text-center mb-4">Analyze Any Book</h1>
      <p className="text-xl text-slate-400 text-center mb-12">
        Upload .txt, .pdf, .docx, or .epub → Instant sight-word report + Rocket Edition
      </p>

      {!result && (
        <div className="max-w-xl mx-auto">
          <div className="border-2 border-dashed border-emerald-400 rounded-3xl p-12 text-center">
            <input
              type="file"
              accept=".txt,.pdf,.docx,.epub"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block mx-auto mb-6"
            />
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="px-10 py-5 bg-emerald-400 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-semibold text-xl rounded-3xl flex items-center gap-3 mx-auto"
            >
              {loading ? (
                <>🚀 Processing with rr_processor.py...</>
              ) : (
                <>Launch Analysis</>
              )}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-center mt-8">{error}</p>}

      {result && (
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-emerald-400 mb-2">✅ Rocket Edition Ready!</h2>
            <p className="text-slate-400">{result.message}</p>
          </div>

          {/* Real stats grid from your PDF mockup */}
          <MetricGrid stats={result.stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4">POS Breakdown</h3>
              <POSPieChart />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">Word Length Distribution</h3>
              <WordLengthChart />
            </div>
          </div>

          {/* Interactive Rocket Reader with POS + Dolch toggles */}
          <div>
            <h3 className="text-2xl font-semibold mb-6">Interactive Rocket Reader</h3>
            <RocketReader html={result.html} />
          </div>

          <button
            onClick={() => { setResult(null); setFile(null); }}
            className="block mx-auto px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl"
          >
            Analyze Another Book
          </button>
        </div>
      )}
    </div>
  );
}
