import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { bookHref } from '@/lib/bookSources';
import { sourceBooksForSitemap, sourceSitemapCount } from '@/lib/sourceSitemapData';

// Non-Gutenberg book pages: /book/sources/sitemap/{n}.xml (listed in robots.txt).
// The Gutenberg series /book/sitemap/{n}.xml is unchanged.
export const revalidate = 86400;

export async function generateSitemaps() {
  const count = await sourceSitemapCount();
  // Always emit file 0 so the route exists (empty when no extra source is enabled).
  return Array.from({ length: Math.max(1, count) }, (_, id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const index = Number(await props.id);
  if (!Number.isInteger(index) || index < 0) return [];
  const books = await sourceBooksForSitemap(index);
  return books.map((b) => ({
    url: `${SITE_URL}${bookHref(b.source, b.sourceId)}`,
    ...(b.lastModified ? { lastModified: new Date(b.lastModified) } : {}),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));
}
