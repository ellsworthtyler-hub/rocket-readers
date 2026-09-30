'use client';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Suspense, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PaidPlan } from '@/lib/plans';

const sharedFeatures = [
  'Enhanced Rocket Reader editions',
  'Sight-word and parts-of-speech highlights',
  'Charts and word-length reports',
  'Classwork packets',
  'One class code students type on the Students page',
];

function PremiumPageContent() {
  const { user, adultPlan, hasBilling, loading, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled');
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<PaidPlan | null>(null);

  const handleSubscribe = async (plan: PaidPlan) => {
    setError(null);
    if (!user) return;
    setBusyPlan(plan);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError('Please log in first.');
        return;
      }
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
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

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-xl">Loading...</div>;
  }

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose a Rocket Readers plan</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Free keeps the library and the stats. Premium and Teacher open the same enhanced books and classwork packets.
          </p>
        </div>

        {canceled === 'true' && (
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
            name="Premium"
            audience="Parents and homeschoolers"
            price="$5"
            period="/month"
            note="One class code, meant for up to 6 students. We do not count or block extra students."
            highlighted
            features={['Everything in Free', ...sharedFeatures]}
            action={
              <PlanButton
                plan="premium"
                current={adultPlan}
                signedIn={!!user}
                busy={busyPlan === 'premium'}
                highlighted
                hasBilling={hasBilling}
                onSubscribe={handleSubscribe}
              />
            }
          />

          <PlanCard
            name="Teacher"
            audience="Public school classrooms"
            price="$25"
            period="/month"
            note="One class code, meant for up to 30 students. We do not count or block extra students."
            features={['Everything in Premium', 'The same books and packets, sized for a class']}
            action={
              <PlanButton
                plan="teacher"
                current={adultPlan}
                signedIn={!!user}
                busy={busyPlan === 'teacher'}
                hasBilling={hasBilling}
                onSubscribe={handleSubscribe}
              />
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
}: {
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
    ? `Switch to ${plan === 'teacher' ? 'Teacher' : 'Premium'}`
    : `Subscribe ${plan === 'teacher' ? 'Teacher' : 'Premium'}`;

  return (
    <button type="button" onClick={() => onSubscribe(plan)} disabled={busy} className={`${solid} disabled:opacity-60`}>
      {busy ? 'Working…' : label}
    </button>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-xl text-slate-600">Loading plans...</div>}>
      <PremiumPageContent />
    </Suspense>
  );
}
