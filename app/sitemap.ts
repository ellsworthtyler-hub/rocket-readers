import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Static pages. Book pages live in /book/sitemap/{id}.xml (listed in robots.txt).
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ['/', 1],
    ['/search', 0.9],
    ['/premium', 0.8],
    ['/themes', 0.7],
    ['/leaderboard', 0.7],
    ['/parts-of-speech', 0.6],
    ['/about', 0.6],
    ['/about/sample-books', 0.5],
    ['/students', 0.4],
    ['/privacy', 0.2],
    ['/terms', 0.2],
  ];
  return pages.map(([path, priority]) => ({ url: `${SITE_URL}${path}`, changeFrequency: 'weekly', priority }));
}
