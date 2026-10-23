// First-touch marketing attribution (UTM params, referrer, landing path).
// Stored in a first-party cookie on the first landing, and copied onto the Stripe
// checkout session metadata so purchases can be attributed. No database storage.

export const ATTRIBUTION_COOKIE = 'rr_attr';
export const ATTRIBUTION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type Attribution = Partial<Record<(typeof UTM_KEYS)[number] | 'referrer' | 'landing_path' | 'first_seen', string>>;

const MAX_VALUE = 200; // keeps the cookie small; Stripe allows 500 chars per metadata value

function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim().slice(0, MAX_VALUE);
  return v || undefined;
}

/** Build the first-touch record from the landing URL and document.referrer. */
export function buildAttribution(url: URL, referrer: string, now = new Date()): Attribution {
  const out: Attribution = {};
  for (const k of UTM_KEYS) {
    const v = clean(url.searchParams.get(k));
    if (v) out[k] = v;
  }
  // Only record external referrers; internal navigation is not a source.
  try {
    if (referrer) {
      const ref = new URL(referrer);
      if (ref.host !== url.host) out.referrer = clean(ref.origin + ref.pathname);
    }
  } catch {
    // ignore malformed referrer
  }
  out.landing_path = clean(url.pathname);
  out.first_seen = now.toISOString();
  return out;
}

export function serializeAttribution(a: Attribution): string {
  return encodeURIComponent(JSON.stringify(a));
}

/** Parse the cookie value; returns only known keys with string values. */
export function parseAttribution(raw: string | undefined | null): Attribution | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(decodeURIComponent(raw));
    if (!obj || typeof obj !== 'object') return null;
    const out: Attribution = {};
    for (const k of [...UTM_KEYS, 'referrer', 'landing_path', 'first_seen'] as const) {
      const v = clean(typeof obj[k] === 'string' ? obj[k] : undefined);
      if (v) out[k] = v;
    }
    return out;
  } catch {
    return null;
  }
}

/** Read the attribution cookie out of a Cookie request header. */
export function attributionFromCookieHeader(header: string | null): Attribution | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === ATTRIBUTION_COOKIE) return parseAttribution(part.slice(i + 1).trim());
  }
  return null;
}

/** Stripe metadata entries, prefixed with attr_ so they never clash with userId/plan. */
export function attributionMetadata(a: Attribution | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!a) return out;
  for (const [k, v] of Object.entries(a)) if (v) out[`attr_${k}`] = v;
  return out;
}
