import { NextResponse } from 'next/server';
import { clientIp } from '@/lib/access';
import { profileIsPaid } from '@/lib/plans';
import { isValidStudentCode, normalizeStudentCode } from '@/lib/studentCode';
import { CLASS_COOKIE, classCookieOptions, signStudentCookie } from '@/lib/studentCookie';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const GENERIC_ERROR = "That code doesn't work. Check with your parent or teacher.";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabaseAdmin
    .from('student_code_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('attempted_at', since);
  if (countError) return NextResponse.json({ error: 'Try again in a moment.' }, { status: 500 });
  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: 'Too many tries. Wait an hour and try again.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const code = typeof body?.code === 'string' ? normalizeStudentCode(body.code) : '';
  if (!isValidStudentCode(code)) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, plan, subscription_status')
    .eq('student_code', code)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Try again in a moment.' }, { status: 500 });

  if (!profile || !profileIsPaid(profile)) {
    await supabaseAdmin.from('student_code_attempts').insert({ ip });
    await supabaseAdmin
      .from('student_code_attempts')
      .delete()
      .lt('attempted_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CLASS_COOKIE, signStudentCookie(profile.id), classCookieOptions());
  return response;
}
