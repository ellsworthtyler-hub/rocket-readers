import { NextResponse } from 'next/server';
import { userFromAuthHeader } from '@/lib/access';
import { loadSubscription, stripe, syncProfileFromSubscription } from '@/lib/billing';
import { priceIdForPlan, siteBase, type PaidPlan } from '@/lib/plans';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const user = await userFromAuthHeader(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan = body?.plan as PaidPlan;
    if (plan !== 'premium' && plan !== 'teacher') {
      return NextResponse.json({ error: 'Choose Premium or Teacher.' }, { status: 400 });
    }

    const priceId = priceIdForPlan(plan);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id, plan, subscription_status')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);

    const currentId = profile?.stripe_subscription_id;
    const canSwitch = profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing';
    if (currentId && canSwitch) {
      if (profile.plan === plan) {
        return NextResponse.json({ updated: true, plan });
      }

      const current = await stripe.subscriptions.retrieve(currentId);
      if (current.status === 'active' || current.status === 'trialing') {
        const itemId = current.items.data[0]?.id;
        if (!itemId) {
          return NextResponse.json({ error: 'This subscription cannot be changed yet.' }, { status: 409 });
        }
        await stripe.subscriptions.update(current.id, {
          items: [{ id: itemId, price: priceId }],
          proration_behavior: 'create_prorations',
          cancel_at_period_end: false,
          metadata: { userId: user.id, plan },
        });
        const refreshed = await loadSubscription(current.id);
        await syncProfileFromSubscription({ userId: user.id, subscription: refreshed });
        return NextResponse.json({ updated: true, plan });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteBase()}/account?success=true`,
      cancel_url: `${siteBase()}/premium?canceled=true`,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
      subscription_data: { metadata: { userId: user.id, plan } },
      ...(profile?.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : user.email
          ? { customer_email: user.email }
          : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    console.error('Stripe Checkout Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
