//  FILE:  app/premium/page.tsx
//  ============================
'use client';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * 1. INNER COMPONENT
 * We move all the logic using useSearchParams into this sub-component.
 */
function PremiumPageContent() {
  const { user, isPremium, loading, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  // Auto-refresh after Stripe success
  useEffect(() => {
    if (success === 'true' && user) {
      console.log('✅ Stripe success detected — refreshing profile');
      refreshProfile();
    }
  }, [success, user, refreshProfile]);

  const handleSubscribe = async (priceId: string) => {
    console.log('🚀 Subscribe button clicked for price:', priceId);
    if (!user) {
      alert('Please log in first!');
      return;
    }

    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          email: user.email,
          priceId: priceId 
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error(data.error);
        alert("Failed to create checkout session.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Unlock Rocket Reader Premium</h1>
          <p className="text-xl text-slate-600">Enhanced editions with sight-word highlights, charts, and downloads</p>
        </div>

        {success === 'true' && (
          <div className="bg-emerald-100 border border-emerald-400 text-emerald-800 px-6 py-4 rounded-3xl text-center mb-8">
            🎉 Payment successful! Upgrading your account now…
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 flex flex-col">
            <h2 className="text-2xl font-semibold mb-2">Free</h2>
            <p className="text-slate-500 mb-6">Discovery &amp; stats</p>
            <ul className="space-y-4 mb-8 text-sm flex-grow">
              <li>✓ Full search library</li>
              <li>✓ Book statistics</li>
              <li>✓ Gutenberg links</li>
              <li>✓ Sample enhanced preview</li>
            </ul>
            <div className="text-4xl font-bold mb-8">$0</div>
            <Link href="/search" className="block text-center py-4 bg-slate-900 text-white rounded-3xl font-medium">Continue Free</Link>
          </div>

          {/* Premium Tier */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-3xl p-8 relative flex flex-col">
            <div className="absolute -top-3 right-6 bg-amber-400 text-emerald-900 text-xs font-bold px-4 py-1 rounded-3xl">RECOMMENDED</div>
            <h2 className="text-2xl font-semibold mb-2">Premium</h2>
            <p className="opacity-90 mb-6">Full enhanced readers</p>

            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-6xl font-bold">$4.99</span>
              <span className="text-xl opacity-75">/mo</span>
              <span className="ml-auto text-sm bg-white/20 px-3 py-1 rounded-2xl">or $49.99/year</span>
            </div>

            <ul className="space-y-4 mb-8 text-sm flex-grow">
              <li>✓ Everything in Free</li>
              <li>✓ Unlimited enhanced Rocket Reader editions</li>
              <li>✓ Toggle Dolch / Fry / POS highlights</li>
              <li>✓ Charts + word-length reports</li>
              <li>✓ One-click EPUB/PDF download</li>
            </ul>

            {user ? (
              isPremium ? (
                <div className="text-center py-8 bg-white/20 rounded-3xl font-semibold text-2xl border border-white/30">
                  ✅ You are Premium!
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Monthly Button */}
                  <button 
                    onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY!)}
                    className="flex-1 py-4 bg-white text-emerald-700 rounded-2xl font-semibold hover:bg-emerald-50 transition shadow-sm border border-emerald-100 flex flex-col items-center justify-center"
                  >
                    <span className="text-lg">Monthly</span>
                    <span className="text-xs font-normal text-slate-500 mt-1">$4.99 / mo</span>
                  </button>

                  {/* Yearly Button (Best Value) */}
                  <button 
                    onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY!)}
                    className="flex-1 py-4 bg-emerald-800 text-white rounded-2xl font-semibold hover:bg-emerald-900 transition shadow-md relative flex flex-col items-center justify-center border border-emerald-500"
                  >
                    <div className="absolute -top-3 bg-amber-400 text-amber-900 text-[10px] uppercase tracking-wide font-bold px-3 py-0.5 rounded-full shadow-sm">
                      Save 16%
                    </div>
                    <span className="text-lg">Annually</span>
                    <span className="text-xs font-normal text-emerald-200 mt-1">$49.99 / yr</span>
                  </button>
                </div>
              )
            ) : (
              <button 
                onClick={() => alert('Please log in first using the top navbar')}
                className="w-full py-4 bg-white text-emerald-700 rounded-3xl font-semibold text-lg hover:bg-emerald-50"
              >
                Sign in to Subscribe
              </button>
            )}

            {user && (
              <button onClick={handleLogout} className="mt-6 w-full py-3 text-white/80 hover:text-white text-sm">Log out</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. MASTER WRAPPER
 * This is the only 'default export'. It wraps our content in Suspense
 * to satisfy the Next.js production build requirements.
 */
export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-xl text-slate-600">Loading checkout...</div>}>
      <PremiumPageContent />
    </Suspense>
  );
}