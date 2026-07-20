// lib/themes.ts
// Parent themes stored on rr_book.theme (from rr_category_assign.py / Gutenberg categories).
// Search used to hardcode Animals / Fairy Tales / Adventure — those are NOT parent themes
// (Adventure is a leaf under Literature; Animals/Fairy Tales are not in the taxonomy).

/** Official parent groups written to rr_book.theme */
export const RR_PARENT_THEMES = [
  'Literature',
  'History',
  'Science & Technology',
  'Arts & Culture',
  'Lifestyle & Hobbies',
  'Religion & Philosophy',
  'Education & Reference',
  'Social Sciences & Society',
  'Health & Medicine',
  'Uncategorized',
] as const;

export type RrParentTheme = (typeof RR_PARENT_THEMES)[number];

/**
 * Map short / legacy URL params → stored parent theme.
 * (Old dropdown used "Science"; DB has "Science & Technology".)
 * Labels like Animals / Fairy Tales / Adventure were never stored as parent themes.
 */
export const LEGACY_THEME_ALIASES: Record<string, string> = {
  Science: 'Science & Technology',
  Technology: 'Science & Technology',
  Arts: 'Arts & Culture',
  Culture: 'Arts & Culture',
  Religion: 'Religion & Philosophy',
  Philosophy: 'Religion & Philosophy',
  Education: 'Education & Reference',
  Reference: 'Education & Reference',
  Society: 'Social Sciences & Society',
  Health: 'Health & Medicine',
  Medicine: 'Health & Medicine',
  Lifestyle: 'Lifestyle & Hobbies',
  Hobbies: 'Lifestyle & Hobbies',
};

/** Normalize a theme filter value from URL or UI to the stored parent theme. */
export function resolveThemeFilter(raw: string): string {
  const t = (raw || '').trim();
  if (!t) return '';
  if (LEGACY_THEME_ALIASES[t]) return LEGACY_THEME_ALIASES[t];
  // Exact parent
  if ((RR_PARENT_THEMES as readonly string[]).includes(t)) return t;
  // Case-insensitive match against parents
  const lower = t.toLowerCase();
  const hit = RR_PARENT_THEMES.find((p) => p.toLowerCase() === lower);
  if (hit) return hit;
  // Partial match (e.g. "Science" already handled; "science & tech")
  const partial = RR_PARENT_THEMES.find(
    (p) => p.toLowerCase().includes(lower) || lower.includes(p.toLowerCase())
  );
  return partial || t;
}
