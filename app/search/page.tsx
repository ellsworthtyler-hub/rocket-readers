import type { Metadata } from 'next';
import { resolveThemeFilter } from '@/lib/themes';
import {
  defaultSearchFilters,
  fetchLibraryStats,
  fetchSearchPage,
  fetchThemeOptions,
} from '@/lib/searchQuery';
import SearchClient from './SearchClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}): Promise<Metadata> {
  const theme = resolveThemeFilter((await searchParams).theme || '');
  return theme
    ? {
        title: `${theme} books by sight-word coverage`,
        description: `Search public-domain ${theme} books by Dolch and Fry sight-word coverage, dialogue, length, and reading grade.`,
        alternates: { canonical: `/search?theme=${encodeURIComponent(theme)}` },
      }
    : {
        title: 'Search the library by sight words and reading level',
        description:
          'Search tens of thousands of public-domain books by Dolch and Fry sight-word coverage, dialogue, length, theme, and reading grade.',
        alternates: { canonical: '/search' },
      };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const theme = resolveThemeFilter((await searchParams).theme || '');
  const [page, stats, themeOptions] = await Promise.all([
    fetchSearchPage(defaultSearchFilters(theme)),
    fetchLibraryStats(),
    fetchThemeOptions(),
  ]);

  return (
    <SearchClient
      key={theme}
      initialTheme={theme}
      initialBooks={page?.books ?? []}
      initialTotal={page?.total ?? 0}
      initialStats={stats}
      initialThemeOptions={themeOptions}
    />
  );
}
