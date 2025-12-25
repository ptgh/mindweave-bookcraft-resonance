import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEnhancedToast } from './use-enhanced-toast';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  reading_preferences: Record<string, any>;
  notification_settings: {
    email: boolean;
    push: boolean;
  };
  theme_preference: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  last_active: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user' | 'premium';
  granted_by?: string;
  granted_at: string;
}

export const useProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useEnhancedToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Combined loading: true if auth is loading OR if we have a user and role data is not ready yet
  // NOTE: we must treat "userRole === null" as loading even if dataLoading flipped false in the same render,
  // otherwise protected routes can redirect before role state commits.
  const loading = authLoading || (!!user && (dataLoading || userRole === null));
  useEffect(() => {
    const loadUserData = async () => {
      if (authLoading) {
        // Wait for auth to finish
        return;
      }
      
      if (!user) {
        setProfile(null);
        setUserRole(null);
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      try {
        // Fetch both profile and role in parallel, then commit state together
        const [nextProfile, nextRole] = await Promise.all([fetchProfile(), fetchUserRole()]);
        console.log('Profile/Role loaded:', { profile: !!nextProfile, role: nextRole?.role });
        setProfile(nextProfile);
        setUserRole(nextRole);
      } finally {
        setDataLoading(false);
      }
    };

    loadUserData();

    // Set up real-time subscription for profile updates
    if (user) {
      const profileChannel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('Profile updated:', payload);
            if (payload.eventType === 'UPDATE') {
              setProfile(payload.new as UserProfile);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profileChannel);
      };
    }
  }, [user, authLoading]);

  const fetchProfile = async (): Promise<UserProfile | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return (data as UserProfile) ?? null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const fetchUserRole = async (): Promise<UserRole | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .order('granted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return (data as UserRole) ?? null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Error updating profile",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
        variant: "success"
      });

      // Optimistically update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateLastActive = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ last_active: new Date().toISOString() })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  };

  const hasRole = useCallback((role: 'admin' | 'moderator' | 'user' | 'premium'): boolean => {
    if (!userRole) return false;

    // Admin has access to everything
    if (userRole.role === 'admin') return true;

    // Check for specific role or higher
    const roleHierarchy = { admin: 4, moderator: 3, premium: 2, user: 1 } as const;
    const userLevel = roleHierarchy[userRole.role];
    const requiredLevel = roleHierarchy[role];

    return userLevel >= requiredLevel;
  }, [userRole]);

  return {
    profile,
    userRole,
    loading,
    updateProfile,
    updateLastActive,
    hasRole,
    refetch: async () => {
      const next = await fetchProfile();
      setProfile(next);
      return next;
    }
  };
};