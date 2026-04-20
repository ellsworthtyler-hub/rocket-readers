//  app/api/stripe/webhook/route.ts
//  =================================

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

// 2. Initialize Supabase Admin (Bypasses RLS to update profiles)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    // 3. Verify the message is genuinely from Stripe
    event = stripe.webhooks.constructEvent(
      body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET! 
    );
  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 4. Handle the successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // We safely extract the userId here
    const userId = session.metadata?.userId;

    if (userId) {
      // 5. Upgrade the user in the database!
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating Supabase:', error);
        return new Response('Database error', { status: 500 });
      }
      
      console.log(`✅ SUCCESS! User ${userId} upgraded to Premium!`);
    } else {
      console.error('❌ Webhook received payment, but no userId was found in metadata.');
    }
  }

  return NextResponse.json({ received: true });
}