// components/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/data';

type AuthContextType = {
  user: any | null;
  isPremium: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isPremium: false,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // @ts-ignore - Supabase does not auto-generate types for custom tables
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', currentUser.id)
          .single();

        setIsPremium(!!profile?.is_premium);
      } else {
        setIsPremium(false);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // @ts-ignore - Supabase does not auto-generate types for custom tables
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', currentUser.id)
          .single();
        setIsPremium(!!profile?.is_premium);
      } else {
        setIsPremium(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isPremium, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);