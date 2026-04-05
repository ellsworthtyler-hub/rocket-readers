// app/book/[id]/page.tsx
import MetricGrid from "@/components/MetricGrid";
import POSPieChart from "@/components/POSPieChart";
import WordLengthChart from "@/components/WordLengthChart";
import RocketReader from "@/components/RocketReader";

export default function BookPage({ params }: { params: { id: string } }) {
  // Mock data for now (we'll connect real CSV + processor later)
  const stats = {
    dolchBreadth: "87%",
    dolchSight: "64%",
    frySight: "71%",
    fleschGrade: "4.8",
    fleschEase: "78.5",
    dialogRatio: "42%",
  };

  const sampleHtml = `<p>This is a <span class="dolch-prek">sample</span> Rocket Reader with <span class="pos-noun">nouns</span> and <span class="pos-verb">verbs</span> highlighted.</p>`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-2">Alice's Adventures in Wonderland</h1>
      <p className="text-slate-400">by Lewis Carroll • Gutenberg #11</p>
      
      <MetricGrid stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4">POS Breakdown</h2>
          <POSPieChart />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Word Length Distribution</h2>
          <WordLengthChart />
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-semibold mb-6">Interactive Rocket Reader</h2>
        <RocketReader html={sampleHtml} />
      </div>
    </div>
  );
}
