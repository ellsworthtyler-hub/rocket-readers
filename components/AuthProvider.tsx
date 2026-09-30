'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import type { PlanId } from '@/lib/plans';

type AccessVia = 'adult' | 'student' | 'none';

interface AuthContextType {
  user: User | null;
  isPremium: boolean;
  plan: PlanId;
  adultPlan: PlanId | null;
  hasBilling: boolean;
  accessVia: AccessVia;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isPremium: false,
  plan: 'free',
  adultPlan: null,
  hasBilling: false,
  accessVia: 'none',
  loading: true,
  refreshProfile: async () => {},
});

function safeNextPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) return null;
  return value;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [plan, setPlan] = useState<PlanId>('free');
  const [adultPlan, setAdultPlan] = useState<PlanId | null>(null);
  const [hasBilling, setHasBilling] = useState(false);
  const [accessVia, setAccessVia] = useState<AccessVia>('none');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  const fetchAccess = useCallback(async (current: Session | null) => {
    setUser(current?.user ?? null);
    setSession(current);

    const next = safeNextPath(window.sessionStorage.getItem('rr_next'));
    if (current && next && window.location.pathname !== next) {
      window.sessionStorage.removeItem('rr_next');
      window.location.assign(next);
      return;
    }

    try {
      const headers: HeadersInit = {};
      if (current?.access_token) headers.Authorization = `Bearer ${current.access_token}`;
      const res = await fetch('/api/access', { headers, cache: 'no-store' });
      const body = await res.json();
      setIsPremium(!!body.paid);
      setPlan(body.plan === 'premium' || body.plan === 'teacher' ? body.plan : 'free');
      setAdultPlan(body.adultPlan === 'premium' || body.adultPlan === 'teacher' || body.adultPlan === 'free'
        ? body.adultPlan
        : null);
      setAccessVia(body.via === 'adult' || body.via === 'student' ? body.via : 'none');
      setHasBilling(!!body.hasBilling);
    } catch (err) {
      console.error('Access check failed:', err);
      setIsPremium(false);
      setPlan('free');
      setHasBilling(false);
      setAccessVia(current ? 'adult' : 'none');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchAccess(session);
  }, [fetchAccess, session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      fetchAccess(current);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, current) => {
      fetchAccess(current);
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchAccess]);

  return (
    <AuthContext.Provider value={{ user, isPremium, plan, adultPlan, hasBilling, accessVia, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
