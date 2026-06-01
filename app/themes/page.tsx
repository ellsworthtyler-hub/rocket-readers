//  FILE: app/themes/page.tsx
//  Created with GEMINI AI (Pro)
//  =========================

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export default async function ThemesPage() {
  // Fetch aggregate counts per theme. 
  // Note: Adjust the column 'theme' if it's currently stored under 'subjects' in your schema.
  const { data: themeData, error } = await supabase
    .from('gutenberg_catalog')
    .select('theme');

  if (error) console.error("Error fetching themes:", error);

  // Aggregate the counts
  const themeCounts: Record<string, number> = {};
  (themeData || []).forEach((row) => {
    const theme = row.theme || "Uncategorized";
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;
  });

  const sortedThemes = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-6xl mx-auto px-6 text-center mb-16">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Explore by Theme</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          Find the perfect book for your classroom by browsing our curated, NLP-analyzed categories.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedThemes.map(([theme, count]) => (
          <Link 
            key={theme} 
            href={`/search?theme=${encodeURIComponent(theme)}`}
            className="group bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all text-left flex flex-col justify-between"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors mb-2">
                {theme}
              </h2>
              <p className="text-slate-500 mb-6">
                Explore our collection of enhanced texts in this category.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                {count.toLocaleString()} Books
              </span>
              <span className="text-emerald-600 font-medium group-hover:translate-x-1 transition-transform">
                Browse →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}