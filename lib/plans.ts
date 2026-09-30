export type PlanId = 'free' | 'premium' | 'teacher';
export type PaidPlan = 'premium' | 'teacher';

const LEGACY_PREMIUM_PRICE_IDS = new Set([
  'price_1TM1gWRoSh753D3KasBAKtpp',
  'price_1TM1gWRoSh753D3K2hcIDzSP',
]);

export function siteBase(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function priceIdForPlan(plan: PaidPlan): string {
  if (plan === 'teacher') {
    const id = process.env.STRIPE_PRICE_ID_TEACHER_MONTHLY
      || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEACHER_MONTHLY;
    if (!id) throw new Error('Teacher price is not configured');
    return id;
  }

  const id = process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY
    || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_MONTHLY
    || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY;
  if (!id) throw new Error('Premium price is not configured');
  return id;
}

export function planFromPrice(priceId: string | null | undefined, metadataPlan?: string | null): PaidPlan | null {
  if (metadataPlan === 'teacher' || metadataPlan === 'premium') return metadataPlan;
  if (!priceId) return null;

  const teacher = process.env.STRIPE_PRICE_ID_TEACHER_MONTHLY
    || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEACHER_MONTHLY;
  const premium = process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY
    || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_MONTHLY;

  if (teacher && priceId === teacher) return 'teacher';
  if (premium && priceId === premium) return 'premium';
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY) return 'premium';
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY) return 'premium';
  if (LEGACY_PREMIUM_PRICE_IDS.has(priceId)) return 'premium';
  return null;
}

export function isPaidStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}

export function profileIsPaid(profile: {
  plan?: string | null;
  subscription_status?: string | null;
} | null): boolean {
  if (!profile) return false;
  return (profile.plan === 'premium' || profile.plan === 'teacher')
    && isPaidStatus(profile.subscription_status);
}

export function planLabel(plan: string | null | undefined): string {
  if (plan === 'teacher') return 'Teacher';
  if (plan === 'premium') return 'Premium';
  return 'Free';
}
