"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export interface Profile {
  id: string;
  full_name: string | null;
  role: 'admin' | 'pm' | 'employee' | 'client' | 'member';
  points: number;
  level: number;
  avatar_url: string | null;
  status: 'active' | 'blocked';
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = React.useRef(0);
  const router = useRouter();

  const fetchProfile = async (userId: string, currentFetchId: number) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);
        
      if (error) {
        console.error('Error fetching profile:', error.message || error);
      } else if (data && data.length > 0) {
        const profileData = data[0];
        if (fetchIdRef.current === currentFetchId) {
          if (profileData.status === 'blocked') {
            alert('Your account has been blocked. Please contact an administrator.');
            await supabase.auth.signOut();
            router.push('/login');
            return;
          }
          setProfile(profileData as Profile);
        }
      } else if (fetchIdRef.current === currentFetchId) {
        // Fallback: the trigger should have created it, but if not (e.g. old user), create it now
        console.warn('Profile not found for user, attempting fallback creation...');
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              full_name: userData.user.user_metadata?.full_name || null,
              avatar_url: userData.user.user_metadata?.avatar_url || null,
              role: userData.user.user_metadata?.role || 'employee'
            })
            .select();
          
          if (!createError && newProfile && newProfile.length > 0 && fetchIdRef.current === currentFetchId) {
            setProfile(newProfile[0] as Profile);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
    }
  };

  useEffect(() => {
    // Initial fetch of session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (_event === 'SIGNED_OUT') {
        setProfile(null);
        // Clean up localStorage
        for (const key in localStorage) {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        }
      }
      
      setLoading(false);

      if (newSession?.user) {
        fetchIdRef.current += 1;
        fetchProfile(newSession.user.id, fetchIdRef.current);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
