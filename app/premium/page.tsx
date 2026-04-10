// app/premium/page.tsx
'use client';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/data';
import Link from 'next/link';

export default function PremiumPage() {
  const { user, isPremium } = useAuth();

  const handleSignUp = async () => {
    const email = prompt('Enter your email to receive a magic login link:');
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'https://rocket-readers.vercel.app/premium',
      },
    });

    if (error) alert('Error: ' + error.message);
    else alert('Magic link sent! Check your email.');
  };

  const activatePremiumDemo = async () => {
    if (!user) return;

    // @ts-expect-error - Supabase typing is strict on this table
    const { error } = await (supabase
      .from('profiles')
      .update({ is_premium: true } as any)
      .eq('id', user.id) as any);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('✅ Premium activated for testing!');
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Unlock Rocket Reader Premium</h1>
          <p className="text-xl text-slate-600">Enhanced editions with sight-word highlights, charts, and downloads</p>
        </div>

        {user && (
          <div className="text-center mb-8 text-sm">
            Logged in as <span className="font-medium">{user.email}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200">
            <h2 className="text-2xl font-semibold mb-2">Free</h2>
            <p className="text-slate-500 mb-6">Discovery &amp; stats</p>
            <ul className="space-y-4 mb-8 text-sm">
              <li>✓ Full search library</li>
              <li>✓ Book statistics</li>
              <li>✓ Gutenberg links</li>
              <li>✓ Sample enhanced preview</li>
            </ul>
            <div className="text-4xl font-bold mb-8">$0</div>
            <Link href="/search" className="block text-center py-4 bg-slate-900 text-white rounded-3xl font-medium">Continue Free</Link>
          </div>

          {/* Premium Tier */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-3xl p-8 relative">
            <div className="absolute -top-3 right-6 bg-amber-400 text-emerald-900 text-xs font-bold px-4 py-1 rounded-3xl">RECOMMENDED</div>
            <h2 className="text-2xl font-semibold mb-2">Premium</h2>
            <p className="opacity-90 mb-6">Full enhanced readers</p>

            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-6xl font-bold">$4.99</span>
              <span className="text-xl opacity-75">/mo</span>
              <span className="ml-auto text-sm bg-white/20 px-3 py-1 rounded-2xl">or $49.99/year</span>
            </div>

            <ul className="space-y-4 mb-8 text-sm">
              <li>✓ Everything in Free</li>
              <li>✓ Unlimited enhanced Rocket Reader editions</li>
              <li>✓ Toggle Dolch / Fry / POS highlights</li>
              <li>✓ Charts + word-length reports</li>
              <li>✓ One-click EPUB/PDF download</li>
            </ul>

            {user ? (
              isPremium ? (
                <div className="text-center py-6 bg-white/20 rounded-3xl font-semibold text-xl">
                  ✅ You are Premium!
                </div>
              ) : (
                <>
                  <button
                    onClick={activatePremiumDemo}
                    className="w-full py-4 bg-white text-emerald-700 rounded-3xl font-semibold text-lg mb-4"
                  >
                    Make me Premium (demo / testing)
                  </button>
                  <button onClick={handleSignUp} className="w-full py-3 text-white/80 hover:text-white text-sm">
                    Resend magic link
                  </button>
                </>
              )
            ) : (
              <button onClick={handleSignUp} className="w-full py-4 bg-white text-emerald-700 rounded-3xl font-semibold text-lg">
                Sign up with email (magic link)
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