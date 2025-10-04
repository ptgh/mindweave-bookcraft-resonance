
import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Auth hook initializing...');
    
    let isMounted = true;
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

    // Safety: ensure we never hang on loading forever
    fallbackTimeout = setTimeout(() => {
      if (!isMounted) return;
      console.warn('Auth init timeout reached — proceeding unauthenticated');
      setLoading(false);
    }, 5000);

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email || 'No user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (fallbackTimeout) {
          clearTimeout(fallbackTimeout);
          fallbackTimeout = null;
        }
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!isMounted) return;
      
      if (error) {
        console.error('Error getting initial session:', error);
      } else {
        console.log('Initial session check:', initialSession?.user?.email || 'No user');
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      }
      
      setLoading(false);
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }
    }).catch((err) => {
      console.error('Unexpected error getting session:', err);
      if (!isMounted) return;
      setLoading(false);
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }
    });

    return () => {
      isMounted = false;
      console.log('Auth cleanup');
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('Signing out...');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Unexpected error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    signOut
  };
};
