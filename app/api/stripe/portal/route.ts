import { NextResponse } from 'next/server';
import { userFromAuthHeader } from '@/lib/access';
import { getPortalConfigurationId, stripe } from '@/lib/billing';
import { siteBase } from '@/lib/plans';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const user = await userFromAuthHeader(req);
    if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account yet. Subscribe first.' }, { status: 409 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      configuration: await getPortalConfigurationId(),
      return_url: `${siteBase()}/account`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not open billing';
    console.error('Stripe portal error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
