import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface FollowedTransmission {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  created_at: string;
  user_id: string;
  user_display_name?: string;
}

export const useFollowing = () => {
  const { user } = useAuth();
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFollowing = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const followingIds = data.map(f => f.following_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, bio')
          .in('id', followingIds);

        if (profileError) throw profileError;
        setFollowing(profiles || []);
      } else {
        setFollowing([]);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchFollowers = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const followerIds = data.map(f => f.follower_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, bio')
          .in('id', followerIds);

        if (profileError) throw profileError;
        setFollowers(profiles || []);
      } else {
        setFollowers([]);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  }, [user]);

  const followUser = useCallback(async (targetUserId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: targetUserId });

      if (error) throw error;
      
      // Create notification for the followed user
      await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: 'new_follower',
          from_user_id: user.id
        });
      
      await fetchFollowing();
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }, [user, fetchFollowing]);

  const unfollowUser = useCallback(async (targetUserId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;
      await fetchFollowing();
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }, [user, fetchFollowing]);

  const isFollowing = useCallback((targetUserId: string) => {
    return following.some(f => f.id === targetUserId);
  }, [following]);

  const searchUsers = useCallback(async (query: string): Promise<UserProfile[]> => {
    if (!user || !query.trim()) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio')
        .neq('id', user.id)
        .ilike('display_name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }, [user]);

  const getFollowedTransmissions = useCallback(async (): Promise<FollowedTransmission[]> => {
    if (!user || following.length === 0) return [];

    try {
      const followingIds = following.map(f => f.id);
      const { data, error } = await supabase
        .from('transmissions')
        .select('id, title, author, cover_url, created_at, user_id')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Add user display names
      return (data || []).map(t => ({
        ...t,
        user_display_name: following.find(f => f.id === t.user_id)?.display_name || 'Unknown'
      }));
    } catch (error) {
      console.error('Error fetching followed transmissions:', error);
      return [];
    }
  }, [user, following]);

  useEffect(() => {
    fetchFollowing();
    fetchFollowers();
  }, [fetchFollowing, fetchFollowers]);

  return {
    following,
    followers,
    loading,
    followUser,
    unfollowUser,
    isFollowing,
    searchUsers,
    getFollowedTransmissions,
    refreshFollowing: fetchFollowing,
  };
};
