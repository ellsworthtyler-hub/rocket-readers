import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { profileIsPaid, type PlanId } from './plans';
import { CLASS_COOKIE, readStudentCookie } from './studentCookie';
import { supabaseAdmin } from './supabaseAdmin';

export type AccessVia = 'adult' | 'student' | 'none';

export type AccessSnapshot = {
  paid: boolean;
  plan: PlanId;
  via: AccessVia;
  adultPlan: PlanId | null;
  hasBilling: boolean;
  userId: string | null;
};

type ProfileRow = {
  id: string;
  plan: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
};

const EMPTY_ACCESS: AccessSnapshot = {
  paid: false,
  plan: 'free',
  via: 'none',
  adultPlan: null,
  hasBilling: false,
  userId: null,
};

function asPlan(value: string | null | undefined): PlanId {
  if (value === 'premium' || value === 'teacher') return value;
  return 'free';
}

export async function userFromAuthHeader(req: Request): Promise<{ id: string; email?: string } | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? undefined };
}

async function loadProfile(id: string): Promise<ProfileRow | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, plan, subscription_status, stripe_customer_id')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('Profile lookup failed:', error.message);
    return null;
  }
  return data;
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim().slice(0, 64) || 'unknown';
  return req.headers.get('x-real-ip')?.trim().slice(0, 64) || 'unknown';
}

export async function resolvePaidAccess(req: NextRequest): Promise<AccessSnapshot> {
  const adult = await userFromAuthHeader(req);
  const adultProfile = adult ? await loadProfile(adult.id) : null;
  const adultPlan = adultProfile ? asPlan(adultProfile.plan) : null;
  const hasBilling = !!adultProfile?.stripe_customer_id;
  const adultPaid = profileIsPaid(adultProfile);

  if (adult && adultPaid) {
    return {
      paid: true,
      plan: adultPlan || 'premium',
      via: 'adult',
      adultPlan,
      hasBilling,
      userId: adult.id,
    };
  }

  const classId = readStudentCookie(req.cookies.get(CLASS_COOKIE)?.value);
  if (classId) {
    const classProfile = await loadProfile(classId);
    if (profileIsPaid(classProfile)) {
      return {
        paid: true,
        plan: asPlan(classProfile?.plan),
        via: 'student',
        adultPlan,
        hasBilling,
        userId: adult?.id ?? null,
      };
    }
  }

  if (adult) {
    return {
      paid: false,
      plan: 'free',
      via: 'adult',
      adultPlan,
      hasBilling,
      userId: adult.id,
    };
  }

  return EMPTY_ACCESS;
}
