
import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState, forceSignOut } from "@/utils/authCleanup";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializationRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializationRef.current) {
      return;
    }
    initializationRef.current = true;

    console.log('Auth hook initializing...');
    
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log('Auth state changed:', event, session?.user?.email);
            
            // Handle different auth events
            switch (event) {
              case 'SIGNED_IN':
                setSession(session);
                setUser(session?.user ?? null);
                setError(null);
                break;
              case 'SIGNED_OUT':
                setSession(null);
                setUser(null);
                setError(null);
                // Clean up any remaining auth state
                setTimeout(() => cleanupAuthState(), 100);
                break;
              case 'TOKEN_REFRESHED':
                setSession(session);
                setUser(session?.user ?? null);
                break;
              case 'USER_UPDATED':
                setSession(session);
                setUser(session?.user ?? null);
                break;
              default:
                setSession(session);
                setUser(session?.user ?? null);
            }
            
            // Set loading to false after any auth event
            setLoading(false);
          }
        );

        // THEN check for existing session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting initial session:', sessionError);
          setError('Failed to retrieve authentication session');
          // Clean up potentially corrupt session data
          cleanupAuthState();
        } else {
          console.log('Initial session check:', initialSession?.user?.email);
        }
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
        }

        return () => {
          console.log('Auth cleanup - unsubscribing');
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setError('Authentication initialization failed');
          setLoading(false);
        }
      }
    };

    const cleanup = initializeAuth();

    return () => {
      mounted = false;
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('Signing out...');
      setLoading(true);
      await forceSignOut(supabase);
      
      // Force page reload for clean state
      setTimeout(() => {
        window.location.href = '/auth';
      }, 500);
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    user,
    session,
    loading,
    error,
    signOut,
    clearError
  };
};
