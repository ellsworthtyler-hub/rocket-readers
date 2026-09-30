'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

export default function StudentsPage() {
  const { accessVia, loading, refreshProfile } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "That code doesn't work. Check with your parent or teacher.");
        return;
      }
      window.location.href = '/search';
    } catch {
      setError('Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    await fetch('/api/student-logout', { method: 'POST' });
    await refreshProfile();
    window.location.href = '/students';
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl shadow-xl border-[3px] border-indigo-400 bg-slate-900/90 p-8">
        <div className="text-5xl mb-4 text-center">📚</div>
        <h1 className="text-3xl font-bold text-center mb-2">Student sign-in</h1>
        <p className="text-slate-600 text-center mb-8">
          Type the class code from your parent or teacher. It looks like apple-12.
        </p>

        {!loading && accessVia === 'student' && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl px-4 py-3 mb-6 text-center">
            This browser already has class access.
            <button type="button" onClick={leave} className="block mx-auto mt-2 text-sm font-semibold underline">
              Leave class
            </button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <label htmlFor="class-code" className="sr-only">Class code</label>
          <input
            id="class-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="apple-12"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full border border-slate-600 bg-slate-950 text-white rounded-2xl px-4 py-4 text-2xl text-center tracking-wide"
          />
          {error && <p className="text-rose-700 text-center">{error}</p>}
          <button
            type="submit"
            disabled={busy || code.trim().length === 0}
            className="w-full bg-emerald-700 text-white py-4 rounded-full text-lg font-semibold disabled:opacity-60"
          >
            {busy ? 'Checking…' : 'Open the books'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-8">
          Parents and teachers <Link href="/login" className="text-emerald-700 underline">sign in here</Link>.
        </p>
      </div>
    </div>
  );
}
