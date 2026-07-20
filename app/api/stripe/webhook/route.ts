// app/api/stripe/webhook/route.ts
// Verifies Stripe signatures and keeps profiles.is_premium in sync with subscription lifecycle.

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function setPremium(
  userId: string,
  isPremium: boolean,
  extras?: { stripe_customer_id?: string; stripe_subscription_id?: string | null }
) {
  const payload: Record<string, unknown> = { is_premium: isPremium };
  if (extras?.stripe_customer_id) payload.stripe_customer_id = extras.stripe_customer_id;
  if (extras && 'stripe_subscription_id' in extras) {
    payload.stripe_subscription_id = extras.stripe_subscription_id;
  }

  const { error } = await supabaseAdmin.from('profiles').update(payload).eq('id', userId);

  if (error) {
    // Retry without optional stripe columns if they do not exist yet
    if (error.message?.includes('stripe_') || error.code === 'PGRST204') {
      const { error: e2 } = await supabaseAdmin
        .from('profiles')
        .update({ is_premium: isPremium })
        .eq('id', userId);
      if (e2) throw e2;
      return;
    }
    throw error;
  }
}

async function findUserIdByCustomer(customerId: string): Promise<string | null> {
  // Prefer profiles.stripe_customer_id when column exists
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (!error && data?.id) return data.id as string;

  // Fallback: Stripe customer metadata
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted) {
      const uid = (customer as Stripe.Customer).metadata?.userId;
      if (uid) return uid;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function userIdFromSubscription(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.userId) return sub.metadata.userId;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  if (customerId) return findUserIdByCustomer(customerId);
  return null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error(`❌ Webhook Error: ${message}`);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.client_reference_id || null;
        if (!userId) {
          console.error('❌ checkout.session.completed missing userId');
          break;
        }
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        await setPremium(userId, true, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subId ?? null,
        });
        console.log(`✅ User ${userId} upgraded to Premium (checkout)`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await userIdFromSubscription(sub);
        if (!userId) {
          console.error('❌ subscription.updated: could not resolve user');
          break;
        }
        const active = sub.status === 'active' || sub.status === 'trialing';
        await setPremium(userId, active, {
          stripe_subscription_id: sub.id,
          stripe_customer_id:
            typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
        });
        console.log(`✅ User ${userId} premium=${active} (subscription.updated ${sub.status})`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await userIdFromSubscription(sub);
        if (!userId) {
          console.error('❌ subscription.deleted: could not resolve user');
          break;
        }
        await setPremium(userId, false, { stripe_subscription_id: null });
        console.log(`✅ User ${userId} premium cleared (subscription.deleted)`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn('⚠️ invoice.payment_failed', invoice.id, invoice.customer);
        // Soft-fail: do not immediately revoke; subscription.updated/deleted will follow.
        break;
      }

      default:
        // Unhandled events are fine
        break;
    }
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return new Response('Webhook handler error', { status: 500 });
  }

  return NextResponse.json({ received: true });
}
