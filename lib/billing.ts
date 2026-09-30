import Stripe from 'stripe';
import { ensureStudentCode } from './classCodes';
import { isPaidStatus, planFromPrice, type PaidPlan } from './plans';
import { supabaseAdmin } from './supabaseAdmin';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

type ProfilePatch = {
  plan: 'free' | PaidPlan;
  is_premium: boolean;
  subscription_status: string;
  stripe_subscription_id: string;
  stripe_customer_id?: string;
  updated_at: string;
};

function customerIdOf(subscription: Stripe.Subscription, explicit?: string | null): string | null {
  if (explicit) return explicit;
  return typeof subscription.customer === 'string' ? subscription.customer : null;
}

function patchForSubscription(subscription: Stripe.Subscription, customerId: string | null): ProfilePatch {
  const price = subscription.items.data[0]?.price;
  const priceId = typeof price === 'string' ? price : price?.id;
  const pricePlan = typeof price === 'object' ? price?.metadata?.plan : null;
  const plan = planFromPrice(priceId, pricePlan || subscription.metadata?.plan);
  const status = subscription.status;
  const ended = status === 'canceled' || status === 'incomplete_expired' || status === 'unpaid' || !plan;

  const patch: ProfilePatch = {
    plan: ended ? 'free' : plan,
    is_premium: !!plan && isPaidStatus(status),
    subscription_status: status,
    stripe_subscription_id: subscription.id,
    updated_at: new Date().toISOString(),
  };
  if (customerId) patch.stripe_customer_id = customerId;
  return patch;
}

async function writeProfile(userId: string, patch: ProfilePatch, createCode: boolean) {
  const { data: existing, error: readError } = await supabaseAdmin
    .from('profiles')
    .select('student_code')
    .eq('id', userId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  if (existing) {
    const { error } = await supabaseAdmin.from('profiles').update(patch).eq('id', userId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin.from('profiles').insert({ id: userId, ...patch });
    if (error) throw new Error(error.message);
  }

  if (createCode && patch.is_premium) {
    await ensureStudentCode(userId, existing?.student_code ?? null);
  }
}

export async function syncProfileFromSubscription(options: {
  userId?: string | null;
  customerId?: string | null;
  subscription: Stripe.Subscription;
}) {
  const customerId = customerIdOf(options.subscription, options.customerId);
  const patch = patchForSubscription(options.subscription, customerId);
  const hintedUserId = options.userId || options.subscription.metadata?.userId || null;

  if (hintedUserId) {
    await writeProfile(hintedUserId, patch, true);
    return;
  }

  let lookup = supabaseAdmin.from('profiles').select('id');
  if (customerId) lookup = lookup.eq('stripe_customer_id', customerId);
  else lookup = lookup.eq('stripe_subscription_id', options.subscription.id);

  const { data, error } = await lookup.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error(`No profile for subscription ${options.subscription.id}`);
  }
  await writeProfile(data.id, patch, true);
}

export async function clearPaidAccess(subscription: Stripe.Subscription) {
  const customerId = customerIdOf(subscription, null);
  const patch = {
    plan: 'free',
    is_premium: false,
    subscription_status: 'canceled',
    updated_at: new Date().toISOString(),
  };

  const userId = subscription.metadata?.userId;
  if (userId) {
    const { error } = await supabaseAdmin.from('profiles').update(patch).eq('id', userId);
    if (error) throw new Error(error.message);
    return;
  }

  const column = customerId ? 'stripe_customer_id' : 'stripe_subscription_id';
  const value = customerId || subscription.id;
  const { error } = await supabaseAdmin.from('profiles').update(patch).eq(column, value);
  if (error) throw new Error(error.message);
}

export async function loadSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  });
}

export async function getPortalConfigurationId(): Promise<string> {
  const existing = await stripe.billingPortal.configurations.list({ limit: 1, active: true });
  if (existing.data[0]) return existing.data[0].id;

  const created = await stripe.billingPortal.configurations.create({
    business_profile: { headline: 'Manage your Rocket Readers plan' },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: 'at_period_end' },
    },
  });
  return created.id;
}
