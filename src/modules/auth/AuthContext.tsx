import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface Profile {
    id: string;
    full_name: string | null;
    role: 'admin' | 'pm' | 'employee' | 'client';
    points: number;
    level: number;
    avatar_url: string | null;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            console.log('Fetching profile for user:', userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }
            console.log('Profile fetched successfully:', data?.role);
            return data as Profile;
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
            return null;
        }
    };

    useEffect(() => {
        // Initial session check
        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    // Handle invalid refresh token errors gracefully
                    if (error.message.includes('Invalid Refresh Token') ||
                        error.message.includes('Refresh Token Not Found')) {
                        console.log('Clearing stale session from storage...');
                        // Clear the invalid session from localStorage
                        await supabase.auth.signOut();
                    } else {
                        console.error('Session initialization error:', error.message);
                    }
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                } else {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        try {
                            const profileData = await fetchProfile(session.user.id);
                            setProfile(profileData);
                            // If profile is missing, we might need to wait for trigger or just allow guest access
                            if (!profileData) {
                                console.warn('Profile not found for user:', session.user.id);
                            }
                        } catch (err) {
                            console.error('Initial profile fetch failed:', err);
                        }
                    }
                }
            } catch (err) {
                console.error('Unexpected error during auth initialization:', err);
                // Clear any potentially corrupted session
                try {
                    await supabase.auth.signOut();
                } catch (signOutErr) {
                    console.error('Error clearing corrupted session:', signOutErr);
                }
                setSession(null);
                setUser(null);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                try {
                    const profileData = await fetchProfile(session.user.id);
                    setProfile(profileData);
                } catch (err) {
                    console.error('Error fetching profile on auth change:', err);
                }
            } else {
                setProfile(null);
            }

            // Critical: Ensure loading is false after auth changes
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        profile,
        loading,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
