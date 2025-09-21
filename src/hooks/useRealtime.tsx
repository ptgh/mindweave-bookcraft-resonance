import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface UseRealtimeOptions {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
}

export const useRealtime = (
  options: UseRealtimeOptions,
  callback: (payload: any) => void
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const {
      table,
      filter,
      event = '*',
      schema = 'public'
    } = options;

    // Create unique channel name
    const channelName = `realtime-${table}-${Math.random().toString(36).substr(2, 9)}`;

    // Create channel and subscribe to changes
    const channel = supabase.channel(channelName);
    
    channel.on(
      'postgres_changes' as any,
      {
        event,
        schema,
        table,
        ...(filter && { filter })
      },
      callback
    ).subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [options.table, options.filter, options.event, options.schema]);

  return {
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }
  };
};

// Hook for user presence tracking
export const usePresence = (roomId: string, userMetadata: Record<string, any>) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel(roomId);

    const setupPresence = async () => {
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userMetadata);
        }
      });
    };

    setupPresence();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, JSON.stringify(userMetadata)]);

  const updatePresence = async (newMetadata: Record<string, any>) => {
    if (channelRef.current) {
      await channelRef.current.track(newMetadata);
    }
  };

  const getPresenceState = () => {
    return channelRef.current?.presenceState() || {};
  };

  return {
    updatePresence,
    getPresenceState,
    channel: channelRef.current
  };
};