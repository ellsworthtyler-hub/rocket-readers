import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { bookSitemapCount } from '@/lib/sitemapData';

export const revalidate = 86400;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const count = await bookSitemapCount();
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
    ],
    host: SITE_URL,
  };
}
