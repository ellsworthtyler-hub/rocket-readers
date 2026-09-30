import { NextResponse } from 'next/server';
import { CLASS_COOKIE } from '@/lib/studentCookie';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CLASS_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
