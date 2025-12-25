import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  user_id: string;
  type: 'new_follower' | 'new_transmission';
  from_user_id: string | null;
  transmission_id: number | null;
  is_read: boolean;
  created_at: string;
  // Joined data
  from_user_name?: string;
  transmission_title?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch additional data for notifications
      const enrichedNotifications = await Promise.all((data || []).map(async (n) => {
        let from_user_name: string | undefined;
        let transmission_title: string | undefined;

        if (n.from_user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', n.from_user_id)
            .single();
          from_user_name = profile?.display_name || 'Someone';
        }

        if (n.transmission_id) {
          const { data: transmission } = await supabase
            .from('transmissions')
            .select('title')
            .eq('id', n.transmission_id)
            .single();
          transmission_title = transmission?.title || 'a book';
        }

        return { ...n, from_user_name, transmission_title } as Notification;
      }));

      setNotifications(enrichedNotifications);
      setUnreadCount(enrichedNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user]);

  const createNotification = useCallback(async (
    targetUserId: string,
    type: 'new_follower' | 'new_transmission',
    transmissionId?: number
  ) => {
    if (!user || targetUserId === user.id) return;

    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type,
          from_user_id: user.id,
          transmission_id: transmissionId || null
        });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // Set up realtime subscription
    if (user) {
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    refreshNotifications: fetchNotifications
  };
};
