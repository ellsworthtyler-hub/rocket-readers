import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { bookSitemapCount } from '@/lib/sitemapData';
import { sourceSitemapCount } from '@/lib/sourceSitemapData';

export const revalidate = 86400;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [count, sourceCount] = await Promise.all([bookSitemapCount(), sourceSitemapCount()]);
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/account'],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      ...Array.from({ length: count }, (_, i) => `${SITE_URL}/book/sitemap/${i}.xml`),
      ...Array.from({ length: sourceCount }, (_, i) => `${SITE_URL}/book/sources/sitemap/${i}.xml`),
    ],
    host: SITE_URL,
  };
}
