// Shared SEO constants and helpers (Phase 4).
export const SITE_URL = 'https://www.rocketreaders.us';
export const SITE_NAME = 'Rocket Readers';
export const SITE_DESCRIPTION =
  'Find public-domain books with the highest sight-word coverage for young readers, with Dolch and Fry stats, reading grade, and enhanced editions.';

/** Format a percentage like 62.2 -> "62%". */
export function pct(value: number | string | null | undefined): string | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${Math.round(n)}%`;
}

/** Format a Flesch-Kincaid grade like 2.34 -> "2.3". */
export function grade(value: number | string | null | undefined): string | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(1);
}

export type BookSeoInput = {
  title: string;
  author: string;
  dolch_percentage?: number | string | null;
  flesch_grade?: number | string | null;
};

export function bookSeoTitle(b: BookSeoInput): string {
  const stats = [pct(b.dolch_percentage) && `Dolch ${pct(b.dolch_percentage)}`, grade(b.flesch_grade) && `Grade ${grade(b.flesch_grade)}`]
    .filter(Boolean)
    .join(', ');
  const byline = b.author && b.author !== 'Unknown Author' ? ` by ${b.author}` : '';
  return stats ? `${b.title}${byline} (${stats})` : `${b.title}${byline}`;
}

export function bookSeoDescription(b: BookSeoInput): string {
  const d = pct(b.dolch_percentage);
  const g = grade(b.flesch_grade);
  const byline = b.author && b.author !== 'Unknown Author' ? ` by ${b.author}` : '';
  const parts = [
    d ? `${d} Dolch sight-word coverage` : null,
    g ? `Flesch-Kincaid grade ${g}` : null,
  ].filter(Boolean);
  const stats = parts.length ? `: ${parts.join(', ')}` : '';
  return `Reading-level stats for ${b.title}${byline}${stats}. A free public-domain book from Project Gutenberg, with a Rocket Readers enhanced edition.`;
}

/** Serialize JSON-LD safely for a <script> tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
