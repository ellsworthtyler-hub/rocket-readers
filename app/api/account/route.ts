import { NextResponse } from 'next/server';
import { userFromAuthHeader } from '@/lib/access';
import { ensureStudentCode } from '@/lib/classCodes';
import { profileIsPaid, type PlanId } from '@/lib/plans';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await userFromAuthHeader(req);
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('plan, subscription_status, student_code, stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const plan = (profile?.plan === 'premium' || profile?.plan === 'teacher' ? profile.plan : 'free') as PlanId;
  const paid = profileIsPaid(profile);
  let studentCode = profile?.student_code ?? null;
  if (paid) {
    try {
      studentCode = await ensureStudentCode(user.id, studentCode);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not create a class code';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({
    plan,
    subscriptionStatus: profile?.subscription_status ?? null,
    paid,
    studentCode,
    hasBilling: !!profile?.stripe_customer_id,
  });
}
