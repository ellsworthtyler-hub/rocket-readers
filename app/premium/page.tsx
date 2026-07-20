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
      // Session is resolved server-side; send Authorization for API auth.
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch('/api/stripe', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priceId }),
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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-xl text-slate-600 font-semibold">
        Loading...
      </div>
    );
  }

  return (
    <div className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-calm-serif text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Unlock Rocket Reader Premium
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto">
            Enhanced editions with sight-word highlights, Heart words, syllables, and book-specific
            classwork packets—priced simply for families and classrooms.
          </p>
        </div>

        {success === 'true' && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-6 py-4 rounded-2xl text-center mb-8 font-semibold">
            Payment successful! Upgrading your account now…
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 flex flex-col shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Free</h2>
            <p className="text-slate-500 mb-6">Discovery &amp; stats</p>
            <ul className="space-y-3 mb-8 text-sm text-slate-600 flex-grow">
              <li>✓ Full search library</li>
              <li>✓ Book statistics</li>
              <li>✓ Gutenberg links</li>
              <li>✓ Sample enhanced preview</li>
            </ul>
            <div className="text-4xl font-extrabold text-slate-900 mb-6">$0</div>
            <Link href="/search" className="btn-calm text-center">
              Continue Free
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="bg-white rounded-3xl p-8 border-2 border-emerald-600 flex flex-col shadow-lg relative">
            <div className="absolute -top-3 right-6 bg-amber-400 text-amber-950 text-xs font-extrabold px-3 py-1 rounded-full">
              RECOMMENDED
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Premium</h2>
            <p className="text-slate-500 mb-6">Full enhanced readers</p>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-extrabold text-slate-900">$4.99</span>
              <span className="text-lg text-slate-500">/mo</span>
            </div>

            <ul className="space-y-3 mb-8 text-sm text-slate-600 flex-grow">
              <li>✓ Everything in Free</li>
              <li>✓ Unlimited full enhanced editions</li>
              <li>✓ Toggle Dolch / Fry / Heart / Syllables / POS</li>
              <li>✓ 10-week classwork packets per book</li>
            </ul>

            {user ? (
              isPremium ? (
                <div className="text-center py-6 bg-emerald-50 rounded-2xl font-bold text-xl text-emerald-800 border border-emerald-100">
                  ✅ You are Premium!
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY!)}
                    className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition flex flex-col items-center"
                  >
                    <span>Monthly</span>
                    <span className="text-xs font-semibold text-emerald-100 mt-0.5">$4.99 / mo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY!)}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition relative flex flex-col items-center"
                  >
                    <span className="absolute -top-2.5 bg-amber-400 text-amber-950 text-[10px] uppercase tracking-wide font-extrabold px-2.5 py-0.5 rounded-full">
                      Save 16%
                    </span>
                    <span>Annually</span>
                    <span className="text-xs font-semibold text-slate-300 mt-0.5">$49.99 / yr</span>
                  </button>
                </div>
              )
            ) : (
              <Link href="/login" className="btn-calm-emerald text-center w-full">
                Sign in to Subscribe
              </Link>
            )}

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-6 w-full py-2 text-slate-500 hover:text-slate-800 text-sm font-semibold"
              >
                Log out
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-10">
          Checkout is handled securely by Stripe. Card details never touch our servers.
        </p>
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
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-xl text-slate-600 font-semibold">
          Loading checkout...
        </div>
      }
    >
      <PremiumPageContent />
    </Suspense>
  );
}