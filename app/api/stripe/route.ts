// app/api/stripe/route.ts — create Checkout Session (session-bound user + price allowlist)
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSessionUser } from '@/lib/serverAuth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

function allowedPriceIds(): Set<string> {
  const ids = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY,
    process.env.STRIPE_PRICE_ID_MONTHLY,
    process.env.STRIPE_PRICE_ID_YEARLY,
  ].filter((x): x is string => !!x && x.length > 0);
  return new Set(ids);
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const priceId = typeof body.priceId === 'string' ? body.priceId : '';

    // Optional: reject spoofed userId if client still sends one
    if (body.userId && body.userId !== user.id) {
      return NextResponse.json({ error: 'User mismatch' }, { status: 403 });
    }

    const allow = allowedPriceIds();
    if (!priceId || !allow.has(priceId)) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const base =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${base}/premium?success=true`,
      cancel_url: `${base}/premium?canceled=true`,
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout error';
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
