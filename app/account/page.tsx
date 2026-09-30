'use client';

import { useAuth } from '@/components/AuthProvider';
import { planLabel, type PlanId } from '@/lib/plans';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type AccountBody = {
  plan: PlanId;
  subscriptionStatus: string | null;
  paid: boolean;
  studentCode: string | null;
  hasBilling: boolean;
};

function AccountPageContent() {
  const { user, loading, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const switched = searchParams.get('switched');
  const [account, setAccount] = useState<AccountBody | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeDraft, setCodeDraft] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const toldNav = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    let cancelled = false;

    async function load(attempt = 0) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch('/api/account', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const body = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(body.error || 'Could not load your account.');
        return;
      }
      setAccount(body);
      if (success === 'true' && body.paid && !toldNav.current) {
        toldNav.current = true;
        refreshProfile();
      }
      if (success === 'true' && !body.studentCode && attempt < 6) {
        window.setTimeout(() => load(attempt + 1), 2000);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [loading, user, success, refreshProfile]);

  async function authHeader() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Please log in again.');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async function saveCode(generate: boolean) {
    setError(null);
    setBusy(generate ? 'generate' : 'save');
    try {
      const res = await fetch('/api/account/code', {
        method: 'POST',
        headers: await authHeader(),
        body: JSON.stringify(generate ? { generate: true } : { code: codeDraft }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Could not change the code.');
        return;
      }
      setAccount((current) => current ? { ...current, studentCode: body.studentCode } : current);
      setCodeDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the code.');
    } finally {
      setBusy(null);
    }
  }

  async function openBilling() {
    setError(null);
    setBusy('billing');
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: await authHeader(),
      });
      const body = await res.json();
      if (!res.ok || !body.url) {
        setError(body.error || 'Could not open billing.');
        return;
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing.');
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-xl">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-3">Sign in to see your plan</h1>
          <Link href="/login?next=/account" className="inline-block bg-emerald-700 text-white px-6 py-3 rounded-full font-semibold">Log in</Link>
        </div>
      </div>
    );
  }

  const statusNote = account?.subscriptionStatus === 'past_due'
    ? 'The last payment did not go through, so the class code is paused.'
    : account && !account.paid && account.studentCode
      ? 'This code is saved, but students cannot use it until the plan is active again.'
      : null;

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-2">Your account</h1>
        <p className="text-slate-600 mb-8">{user.email}</p>

        {success === 'true' && (
          <div className="bg-emerald-100 border border-emerald-400 text-emerald-900 px-6 py-4 rounded-3xl mb-6">
            Payment received. Your class code is below.
          </div>
        )}
        {switched === '1' && (
          <div className="bg-emerald-100 border border-emerald-400 text-emerald-900 px-6 py-4 rounded-3xl mb-6">
            Your plan was updated. Stripe prorates the difference on the next invoice.
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 px-6 py-4 rounded-3xl mb-6">{error}</div>
        )}

        <div className="bg-slate-900/80 border-[3px] border-slate-600 rounded-3xl p-8 mb-6">
          <p className="text-sm text-slate-500 mb-1">Plan</p>
          <p className="text-3xl font-bold mb-2">{account ? planLabel(account.plan) : '…'}</p>
          <p className="text-slate-600 mb-6">
            {account?.plan === 'teacher' && '$25/month · classroom code, meant for up to 30 students'}
            {account?.plan === 'premium' && '$5/month · family code, meant for up to 6 students'}
            {account?.plan === 'free' && 'Search, stats, and sample chapters. Enhanced books are locked.'}
          </p>
          {statusNote && <p className="text-amber-800 mb-6">{statusNote}</p>}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/premium" className="text-center px-5 py-3 rounded-full bg-slate-900 text-white font-medium">Change plan</Link>
            {account?.hasBilling && (
              <button type="button" onClick={openBilling} disabled={busy === 'billing'} className="px-5 py-3 rounded-full border border-slate-300 font-medium disabled:opacity-60">
                {busy === 'billing' ? 'Opening…' : 'Manage billing'}
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-900/80 border-[3px] border-indigo-400 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold mb-2">Class code</h2>
          <p className="text-slate-600 mb-6">
            Tell this to your students. They enter it on the Students page. Changing it signs the old code out immediately.
          </p>
          {account?.studentCode ? (
            <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 mb-6">
              <span className="text-3xl font-bold tracking-wide">{account.studentCode}</span>
              <button
                type="button"
                className="text-sm font-semibold text-emerald-700"
                onClick={async () => {
                  await navigator.clipboard.writeText(account.studentCode || '');
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          ) : (
            <p className="text-slate-500 mb-6">A code appears here after Premium or Teacher is active.</p>
          )}

          {account?.paid && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700" htmlFor="class-code">Use your own code</label>
              <input
                id="class-code"
                value={codeDraft}
                onChange={(event) => setCodeDraft(event.target.value)}
                placeholder="apple-12"
                className="w-full border border-slate-600 bg-slate-950 text-white rounded-2xl px-4 py-3 text-lg"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => saveCode(false)} disabled={busy !== null} className="px-5 py-3 rounded-full bg-emerald-700 text-white font-semibold disabled:opacity-60">
                  {busy === 'save' ? 'Saving…' : 'Save code'}
                </button>
                <button type="button" onClick={() => saveCode(true)} disabled={busy !== null} className="px-5 py-3 rounded-full border border-slate-300 font-medium disabled:opacity-60">
                  {busy === 'generate' ? 'Making one…' : 'Make a new one'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-xl">Loading...</div>}>
      <AccountPageContent />
    </Suspense>
  );
}
