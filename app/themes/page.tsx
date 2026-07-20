//  FILE: app/themes/page.tsx
//  Browse parent themes from processed rr_book + rr_book_metadata

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { RR_PARENT_THEMES } from '@/lib/themes';

export const dynamic = 'force-dynamic';

export default async function ThemesPage() {
  // Count processed books per official parent theme on rr_book.theme
  const themeCounts: { theme: string; count: number }[] = [];

  for (const theme of RR_PARENT_THEMES) {
    const { count, error } = await supabase
      .from('rr_book_metadata')
      .select('book_id, rr_book!inner(theme)', { count: 'exact', head: true })
      .not('last_processed', 'is', null)
      .eq('rr_book.theme', theme);

    if (error) {
      console.error(`Error counting theme ${theme}:`, error);
      continue;
    }
    if ((count || 0) > 0) {
      themeCounts.push({ theme, count: count || 0 });
    }
  }

  themeCounts.sort((a, b) => b.count - a.count);

  const total = themeCounts.reduce((s, t) => s + t.count, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-6xl mx-auto px-6 text-center mb-16">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Explore by Theme
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          Categories follow Project Gutenberg parent groups stored on each book
          ({total.toLocaleString()} processed titles so far).
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themeCounts.map(({ theme, count }) => (
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
                Explore enhanced texts in this category.
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

        {themeCounts.length === 0 && (
          <p className="col-span-full text-center text-slate-500 py-12">
            Theme counts will appear as books finish processing.
          </p>
        )}
      </div>
    </div>
  );
}
