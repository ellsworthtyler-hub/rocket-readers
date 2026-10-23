'use client';

import { track } from '@vercel/analytics';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import type { BillingInterval, PaidPlan } from '@/lib/plans';

// Teacher checkout turns on once this public price id is set in Vercel.
const TEACHER_ENABLED = !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEACHER;

const sharedFeatures = [
  'Enhanced Rocket Readers editions',
  'Sight-word and parts-of-speech highlights',
  'Charts and word-length reports',
  'Classwork packets',
  'One class code students type on the Students page',
];

// Rendered on the server with the signed-out view, so plans and prices are in the HTML;
// auth state fills in the buttons after hydration.
export default function PremiumClient({ canceled }: { canceled: boolean }) {
  const { user, adultPlan, hasBilling, refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: PaidPlan, interval: BillingInterval = 'month') => {
    setError(null);
    if (!user) return;
    setBusyPlan(`${plan}-${interval}`);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError('Please log in first.');
        return;
      }
      track('checkout_started', { plan, interval });
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan, interval }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Checkout failed.');
        return;
      }
      if (body.url) {
        window.location.href = body.url;
        return;
      }
      if (body.updated) {
        await refreshProfile();
        window.location.href = '/account?switched=1';
      }
    } catch (err) {
      console.error(err);
      setError('Checkout failed.');
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose a Rocket Readers plan</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Free keeps the library and the stats. Individual / Family and Teacher plans open the same enhanced books.
          </p>
        </div>

        {canceled && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 px-6 py-4 rounded-3xl text-center mb-8">
            Checkout was canceled. No charge was made.
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 px-6 py-4 rounded-3xl text-center mb-8">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <PlanCard
            name="Free"
            audience="Look around"
            price="$0"
            period=""
            features={[
              'Full search library',
              'Book statistics',
              'Gutenberg links',
              'Sample enhanced preview',
            ]}
            action={<Link href="/search" className="block text-center py-4 bg-slate-900 text-white rounded-3xl font-medium">Continue free</Link>}
          />

          <PlanCard
            name="Individual / Family"
            audience="Parents and homeschoolers"
            price="$4.99"
            period="/month or $49.99/year"
            note="One class code, meant for up to 6 students. We do not count or block extra students."
            highlighted
            features={['Everything in Free', ...sharedFeatures]}
            action={
              <div className="space-y-3">
                <PlanButton
                  plan="premium"
                  current={adultPlan}
                  signedIn={!!user}
                  busy={busyPlan === 'premium-month'}
                  highlighted
                  hasBilling={hasBilling}
                  onSubscribe={(p) => handleSubscribe(p, 'month')}
                  labelSuffix=" — $4.99/mo"
                />
                {user && adultPlan !== 'premium' && (
                  <PlanButton
                    plan="premium"
                    current={adultPlan}
                    signedIn={!!user}
                    busy={busyPlan === 'premium-year'}
                    highlighted
                    hasBilling={hasBilling}
                    onSubscribe={(p) => handleSubscribe(p, 'year')}
                    labelSuffix=" — $49.99/yr"
                  />
                )}
              </div>
            }
          />

          <PlanCard
            name="Teacher"
            audience="Public school classrooms"
            price="$24.99"
            period="/month"
            note="Same content plus a student class code, meant for up to 30 students. We do not count or block extra students."
            features={['Everything in Individual / Family', 'The same books, sized for a class']}
            action={
              TEACHER_ENABLED ? (
                <PlanButton
                  plan="teacher"
                  current={adultPlan}
                  signedIn={!!user}
                  busy={busyPlan === 'teacher-month'}
                  hasBilling={hasBilling}
                  onSubscribe={(p) => handleSubscribe(p, 'month')}
                />
              ) : (
                <button type="button" disabled className="block text-center w-full py-4 bg-slate-200 text-slate-500 rounded-3xl font-semibold cursor-not-allowed">
                  Coming soon
                </button>
              )
            }
          />
        </div>

        <p className="text-center text-slate-500 mt-10 max-w-2xl mx-auto">
          You sign in with Google, X, or Facebook, then subscribe. Students do not create accounts.
          They enter the class code from your Account page at <Link href="/students" className="text-emerald-700 underline">Students</Link>.
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  name,
  audience,
  price,
  period,
  note,
  features,
  action,
  highlighted = false,
}: {
  name: string;
  audience: string;
  price: string;
  period: string;
  note?: string;
  features: string[];
  action: ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div className={`rounded-3xl p-8 flex flex-col border ${highlighted ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-slate-200'}`}>
      <h2 className="text-2xl font-semibold">{name}</h2>
      <p className={`mb-6 ${highlighted ? 'text-emerald-100' : 'text-slate-500'}`}>{audience}</p>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-5xl font-bold">{price}</span>
        {period && <span className={highlighted ? 'text-emerald-100' : 'text-slate-500'}>{period}</span>}
      </div>
      {note && <p className={`text-sm mb-6 ${highlighted ? 'text-emerald-50' : 'text-slate-600'}`}>{note}</p>}
      <ul className="space-y-3 mb-8 text-sm flex-grow">
        {features.map((feature) => <li key={feature}>✓ {feature}</li>)}
      </ul>
      {action}
    </div>
  );
}

function PlanButton({
  plan,
  current,
  signedIn,
  busy,
  highlighted = false,
  hasBilling,
  onSubscribe,
  labelSuffix = '',
}: {
  labelSuffix?: string;
  plan: PaidPlan;
  current: string | null;
  signedIn: boolean;
  busy: boolean;
  highlighted?: boolean;
  hasBilling: boolean;
  onSubscribe: (plan: PaidPlan) => void;
}) {
  const solid = highlighted
    ? 'block text-center w-full py-4 bg-white text-emerald-800 rounded-3xl font-semibold'
    : 'block text-center w-full py-4 bg-emerald-700 text-white rounded-3xl font-semibold';

  if (!signedIn) {
    return (
      <Link href="/login?next=/premium" className={solid}>
        Sign in to subscribe
      </Link>
    );
  }

  if (current === plan && hasBilling) {
    return (
      <Link href="/account" className={highlighted
        ? 'block text-center py-4 bg-white/15 rounded-3xl font-semibold border border-white/40'
        : 'block text-center py-4 bg-emerald-50 text-emerald-900 rounded-3xl font-semibold'}>
        This is your plan
      </Link>
    );
  }

  if (current === plan && !hasBilling) {
    return (
      <button type="button" onClick={() => onSubscribe(plan)} disabled={busy} className={`${solid} disabled:opacity-60`}>
        {busy ? 'Working…' : 'Set up billing'}
      </button>
    );
  }

  const label = current === 'premium' || current === 'teacher'
    ? `Switch to ${plan === 'teacher' ? 'Teacher' : 'Individual / Family'}`
    : `Subscribe${labelSuffix || (plan === 'teacher' ? ' Teacher' : '')}`;

  return (
    <button type="button" onClick={() => onSubscribe(plan)} disabled={busy} className={`${solid} disabled:opacity-60`}>
      {busy ? 'Working…' : label}
    </button>
  );
}
