// FILE: lib/bookSources.ts
// Client-safe registry of book sources, public URL refs and feature flags.
//
// URL scheme (Gutenberg URLs unchanged):
//   /book/{id}              -> Project Gutenberg (US)
//   /book/wikisource-{id}   -> Wikisource
//   /book/wikibooks-{id}    -> Wikibooks
//   /book/pgau-{id}         -> Project Gutenberg Australia (gated, off)
// Ids are kept verbatim (PGA ids have leading zeros).

export type BookSource = 'gutenberg' | 'wikisource' | 'wikibooks' | 'gutenberg_au';

export type SourceInfo = {
  source: BookSource;
  /** URL prefix; null = bare numeric id (Gutenberg). */
  slug: string | null;
  label: string;
  shortLabel: string;
  /** Short license line for tooltips. */
  licenseLine: string;
  licenseName: string | null;
  licenseUrl: string | null;
  /** Whether the text is public domain (affects SEO copy). */
  publicDomain: boolean;
  /** Reader / enhanced edition / packets offered. */
  hasEditions: boolean;
};

export const SOURCES: Record<BookSource, SourceInfo> = {
  gutenberg: {
    source: 'gutenberg',
    slug: null,
    label: 'Project Gutenberg',
    shortLabel: 'Gutenberg',
    licenseLine: 'Public domain in the USA · gutenberg.org',
    licenseName: null,
    licenseUrl: null,
    publicDomain: true,
    hasEditions: true,
  },
  wikisource: {
    source: 'wikisource',
    slug: 'wikisource',
    label: 'Wikisource',
    shortLabel: 'Wikisource',
    licenseLine: 'Text from Wikisource · CC BY-SA 4.0',
    licenseName: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    publicDomain: false,
    hasEditions: false,
  },
  wikibooks: {
    source: 'wikibooks',
    slug: 'wikibooks',
    label: 'Wikibooks',
    shortLabel: 'Wikibooks',
    licenseLine: 'Text from Wikibooks · CC BY-SA 4.0',
    licenseName: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    publicDomain: false,
    hasEditions: false,
  },
  gutenberg_au: {
    source: 'gutenberg_au',
    slug: 'pgau',
    label: 'Australian public-domain archive',
    shortLabel: 'PG Australia',
    licenseLine: 'Public domain in Australia · gutenberg.net.au',
    licenseName: null,
    licenseUrl: null,
    publicDomain: false,
    hasEditions: false,
  },
};

const SLUG_TO_SOURCE: Record<string, BookSource> = {
  wikisource: 'wikisource',
  wikibooks: 'wikibooks',
  pgau: 'gutenberg_au',
};

export type BookRef = { source: BookSource; sourceId: string };

const ID_RE = /^\d{1,10}$/;
const PREFIXED_RE = /^([a-z]+)-(\d{1,10})$/;

/** Parse a /book/[id] URL segment. Returns null for anything we do not route. */
export function parseBookRef(param: string | null | undefined): BookRef | null {
  const p = decodeURIComponent(String(param ?? '')).trim();
  if (ID_RE.test(p)) return { source: 'gutenberg', sourceId: p };
  const m = PREFIXED_RE.exec(p);
  if (!m) return null;
  const source = SLUG_TO_SOURCE[m[1]];
  return source ? { source, sourceId: m[2] } : null;
}

/** Public URL segment for a book. */
export function bookRefParam(source: string | null | undefined, sourceId: string | number): string {
  const info = SOURCES[(source as BookSource) || 'gutenberg'] ?? SOURCES.gutenberg;
  const id = String(sourceId).trim();
  return info.slug ? `${info.slug}-${id}` : id;
}

export function bookHref(source: string | null | undefined, sourceId: string | number): string {
  return `/book/${bookRefParam(source, sourceId)}`;
}

export function sourceInfo(source: string | null | undefined): SourceInfo {
  return SOURCES[(source as BookSource) || 'gutenberg'] ?? SOURCES.gutenberg;
}

/**
 * Feature flag: comma list of non-Gutenberg sources to serve.
 * NEXT_PUBLIC_EXTRA_SOURCES="wikisource" (default) | "wikisource,wikibooks" | "" (off).
 * gutenberg_au additionally needs NEXT_PUBLIC_PGAU_US_PD_GATE=on AND a per-book US public-domain
 * pass (rr_book_qa.rights_status = 'pass'); the gate is OFF by default.
 */
export function enabledExtraSources(): BookSource[] {
  const raw = process.env.NEXT_PUBLIC_EXTRA_SOURCES ?? 'wikisource';
  const out: BookSource[] = [];
  for (const s of raw.split(',').map((x) => x.trim()).filter(Boolean)) {
    if (s === 'wikisource' || s === 'wikibooks') out.push(s);
    if (s === 'gutenberg_au' && pgauGateOn()) out.push(s);
  }
  return out;
}

export function pgauGateOn(): boolean {
  return process.env.NEXT_PUBLIC_PGAU_US_PD_GATE === 'on';
}

export function isSourceEnabled(source: BookSource): boolean {
  return source === 'gutenberg' || enabledExtraSources().includes(source);
}

/** Contributors/history link for a MediaWiki page URL (Wikisource/Wikibooks). */
export function wikiHistoryUrl(originalUrl: string | null | undefined): string | null {
  if (!originalUrl) return null;
  try {
    const u = new URL(originalUrl);
    const m = /^\/wiki\/(.+)$/.exec(u.pathname);
    if (!m) return null;
    return `${u.origin}/w/index.php?title=${m[1]}&action=history`;
  } catch {
    return null;
  }
}
