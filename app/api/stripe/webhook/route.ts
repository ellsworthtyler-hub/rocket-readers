import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { clearPaidAccess, loadSubscription, stripe, syncProfileFromSubscription } from '@/lib/billing';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('Missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'invalid signature';
    console.error(`Webhook Error: ${message}`);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
      if (session.mode === 'subscription' && subscriptionId) {
        const subscription = await loadSubscription(subscriptionId);
        const userId = session.metadata?.userId || session.client_reference_id;
        const customerId = typeof session.customer === 'string' ? session.customer : null;
        await syncProfileFromSubscription({ userId, customerId, subscription });
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = await loadSubscription((event.data.object as Stripe.Subscription).id);
      await syncProfileFromSubscription({ subscription });
    }

    if (event.type === 'customer.subscription.deleted') {
      await clearPaidAccess(event.data.object as Stripe.Subscription);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'webhook handler failed';
    console.error('Webhook handler error:', message);
    return new Response('Webhook handler error', { status: 500 });
  }

  return NextResponse.json({ received: true });
}
