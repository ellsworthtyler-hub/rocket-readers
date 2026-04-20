//  components/AuthProvider.tsx
//  ============================

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isPremium: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isPremium: false,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSessionAndProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setUser(null);
      setIsPremium(false);
      setLoading(false);
      return;
    }

    setUser(currentUser);

    // @ts-ignore - Supabase does not auto-generate types for custom tables
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', currentUser.id)
      .single();

    // @ts-ignore - profile is typed as never
    setIsPremium(!!profile?.is_premium);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchSessionAndProfile(user);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchSessionAndProfile(session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      fetchSessionAndProfile(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isPremium, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);