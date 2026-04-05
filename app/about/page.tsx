// app/about/page.tsx
import { DOLCH_LISTS, FRY_WORDS } from "@/lib/sightWords";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">About Rocket Readers</h1>
      
      <div className="prose prose-invert max-w-none">
        <h2>Dolch Sight Words</h2>
        <p className="text-slate-300">The 220 most common words that make up 50-75% of all children’s books. High Dolch % = easier for early readers.</p>
        
        {Object.entries(DOLCH_LISTS).map(([grade, words]) => (
          <details key={grade} className="mb-6">
            <summary className="cursor-pointer font-medium text-emerald-400">
              {grade.toUpperCase()} ({words.length} words)
            </summary>
            <div className="flex flex-wrap gap-2 mt-3 text-sm">
              {words.map(w => (
                <span key={w} className="bg-white/10 px-3 py-1 rounded-2xl">{w}</span>
              ))}
            </div>
          </details>
        ))}

        <h2>Fry Sight Words</h2>
        <p className="text-slate-300">The top 1,000 words for grades 3-9. We show % coverage to help you pick high-sight-word books.</p>
        <div className="flex flex-wrap gap-2 text-sm bg-white/5 p-6 rounded-3xl">
          {FRY_WORDS.slice(0, 60).map(w => (
            <span key={w} className="bg-amber-900/30 px-3 py-1 rounded-2xl">{w}</span>
          ))}
        </div>

        <h2>Flesch Scores</h2>
        <p className="text-slate-300">Flesch-Kincaid Grade Score = reading level (e.g., 4.8 = late 4th grade). Reading Ease = 0-100 (higher = easier).</p>
      </div>
    </div>
  );
}