// lib/serverAuth.ts — server-only session + premium checks for content APIs
import { createClient, type User } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Admin client (bypasses RLS). Server-only — never expose to browser. */
export function getServiceSupabase() {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Anon client optionally scoped to the caller's JWT (for RLS-aware reads). */
export function getAnonSupabase(accessToken?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Resolve the current user from Authorization: Bearer <jwt>
 * or the sb-*-auth-token cookie patterns used by supabase-js in the browser.
 */
export async function getSessionUser(req: NextRequest): Promise<{
  user: User | null;
  accessToken: string | null;
}> {
  // 1) Explicit Authorization header (fetch with session, or future mobile clients)
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const client = getAnonSupabase(token);
      const { data, error } = await client.auth.getUser(token);
      if (!error && data.user) {
        return { user: data.user, accessToken: token };
      }
    }
  }

  // 2) Supabase auth cookies (SSR / same-origin fetch with credentials)
  // Cookie names vary by project ref: sb-<ref>-auth-token or chunked variants
  const cookieHeader = req.headers.get('cookie') || '';
  const tokenFromCookie = extractAccessTokenFromCookies(cookieHeader);
  if (tokenFromCookie) {
    const client = getAnonSupabase(tokenFromCookie);
    const { data, error } = await client.auth.getUser(tokenFromCookie);
    if (!error && data.user) {
      return { user: data.user, accessToken: tokenFromCookie };
    }
  }

  return { user: null, accessToken: null };
}

function extractAccessTokenFromCookies(cookieHeader: string): string | null {
  if (!cookieHeader) return null;

  // Try common single-cookie JSON blob: sb-xxx-auth-token=<base64 or url-encoded json>
  const parts = cookieHeader.split(';').map((c) => c.trim());
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const name = part.slice(0, eq);
    let value = part.slice(eq + 1);
    if (!name.includes('auth-token') && !name.startsWith('sb-')) continue;
    if (name.endsWith('-code-verifier')) continue;

    try {
      value = decodeURIComponent(value);
    } catch {
      /* keep raw */
    }

    // Chunked cookies: base name.0, .1, …
    // If this is a chunk piece alone, skip; reassemble below.
    if (/\.\d+$/.test(name)) continue;

    const parsed = tryParseSessionJson(value);
    if (parsed) return parsed;
  }

  // Reassemble chunked auth tokens: sb-xxx-auth-token.0 + .1 + …
  const chunkGroups = new Map<string, string[]>();
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const name = part.slice(0, eq);
    let value = part.slice(eq + 1);
    const m = name.match(/^(.*auth-token)\.(\d+)$/);
    if (!m) continue;
    try {
      value = decodeURIComponent(value);
    } catch {
      /* keep */
    }
    const base = m[1];
    const idx = parseInt(m[2], 10);
    if (!chunkGroups.has(base)) chunkGroups.set(base, []);
    chunkGroups.get(base)![idx] = value;
  }

  for (const chunks of chunkGroups.values()) {
    const combined = chunks.filter(Boolean).join('');
    const parsed = tryParseSessionJson(combined);
    if (parsed) return parsed;
  }

  return null;
}

function tryParseSessionJson(raw: string): string | null {
  if (!raw) return null;
  try {
    // Sometimes stored as base64
    let text = raw;
    if (!text.startsWith('{') && !text.startsWith('[')) {
      try {
        text = Buffer.from(raw, 'base64').toString('utf-8');
      } catch {
        text = raw;
      }
    }
    const data = JSON.parse(text);
    if (typeof data?.access_token === 'string') return data.access_token;
    if (Array.isArray(data) && typeof data[0] === 'string') {
      // supabase sometimes stores [access_token, refresh_token, ...]
      return data[0];
    }
    if (typeof data?.[0]?.access_token === 'string') return data[0].access_token;
  } catch {
    // bare JWT?
    if (raw.split('.').length === 3 && raw.length > 40) return raw;
  }
  return null;
}

/** Check profiles.is_premium using service role (authoritative for paywall). */
export async function isUserPremium(userId: string): Promise<boolean> {
  try {
    const admin = getServiceSupabase();
    const { data, error } = await admin
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[serverAuth] premium lookup failed:', error.message);
      return false;
    }
    return !!(data as { is_premium?: boolean } | null)?.is_premium;
  } catch (err) {
    console.error('[serverAuth] premium lookup error:', err);
    return false;
  }
}

/** Require premium for full content; returns response payload if denied, else null. */
export async function requirePremium(req: NextRequest): Promise<
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403; error: string }
> {
  const { user } = await getSessionUser(req);
  if (!user) {
    return { ok: false, status: 401, error: 'Authentication required' };
  }
  const premium = await isUserPremium(user.id);
  if (!premium) {
    return { ok: false, status: 403, error: 'Premium subscription required' };
  }
  return { ok: true, user };
}
