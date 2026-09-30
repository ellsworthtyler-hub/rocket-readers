import { createHmac, timingSafeEqual } from 'crypto';

export const CLASS_COOKIE = 'rr_class';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function cookieSecret(): string {
  const secret = process.env.STUDENT_COOKIE_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STUDENT_COOKIE_SECRET is not configured');
  return secret;
}

export function signStudentCookie(profileId: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({
    id: profileId,
    exp: now + THIRTY_DAYS_MS,
  })).toString('base64url');
  const sig = createHmac('sha256', cookieSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function readStudentCookie(value: string | undefined | null, now = Date.now()): string | null {
  if (!value) return null;
  const dot = value.indexOf('.');
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = createHmac('sha256', cookieSecret()).update(payload).digest('base64url');
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      id?: unknown;
      exp?: unknown;
    };
    if (typeof data.id !== 'string' || typeof data.exp !== 'number') return null;
    if (data.exp < now) return null;
    return data.id;
  } catch {
    return null;
  }
}

export function classCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: THIRTY_DAYS_MS / 1000,
  };
}
