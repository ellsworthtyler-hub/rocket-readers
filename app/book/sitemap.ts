import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { bookSitemapCount, booksForSitemap } from '@/lib/sitemapData';

// Served at /book/sitemap/{id}.xml. Each file covers one rr_book id span (< 50,000 URLs).
export const revalidate = 86400;

export async function generateSitemaps() {
  const count = await bookSitemapCount();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const index = Number(await props.id);
  if (!Number.isInteger(index) || index < 0) return [];
  const books = await booksForSitemap(index);
  return books.map((b) => ({
    url: `${SITE_URL}/book/${b.sourceId}`,
    ...(b.lastModified ? { lastModified: new Date(b.lastModified) } : {}),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
}
