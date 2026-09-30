import { NextResponse } from 'next/server';
import { userFromAuthHeader } from '@/lib/access';
import { replaceStudentCode } from '@/lib/classCodes';
import { profileIsPaid } from '@/lib/plans';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const user = await userFromAuthHeader(req);
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profileIsPaid(profile)) {
    return NextResponse.json({ error: 'Subscribe before setting a class code.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const requested = typeof body?.code === 'string' ? body.code : undefined;
  if (body?.generate !== true && !requested) {
    return NextResponse.json({ error: 'Enter a code, or ask for a new one.' }, { status: 400 });
  }

  try {
    const result = await replaceStudentCode(user.id, body?.generate === true ? undefined : requested);
    if (result.error === 'invalid') {
      return NextResponse.json({
        error: 'Use 4–20 letters, numbers, and hyphens, like apple-12.',
      }, { status: 400 });
    }
    if (result.error === 'taken') {
      return NextResponse.json({ error: 'That code is already in use. Try another.' }, { status: 409 });
    }
    return NextResponse.json({ studentCode: result.code });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not save the code';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
