import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEnhancedToast } from './use-enhanced-toast';

export interface ReadingSession {
  id: string;
  user_id: string;
  book_title: string;
  book_author: string;
  session_start: string;
  session_end?: string;
  pages_read: number;
  notes?: string;
  mood_rating?: number; // 1-5 scale
  created_at: string;
}

export interface ReadingStats {
  total_sessions: number;
  total_pages_read: number;
  total_reading_time: number; // in minutes
  books_read: number;
  average_session_length: number; // in minutes
  favorite_authors: Array<{ author: string; sessions: number }>;
  reading_streak: number; // consecutive days
  last_reading_date?: string;
}

export const useReadingSessions = () => {
  const { user } = useAuth();
  const { toast } = useEnhancedToast();
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [activeSession, setActiveSession] = useState<ReadingSession | null>(null);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessions();
      fetchActiveSession();
      fetchStats();
      
      // Set up real-time subscription
      const sessionsChannel = supabase
        .channel('reading-sessions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reading_sessions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Reading session updated:', payload);
            fetchSessions();
            fetchStats();
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const session = payload.new as ReadingSession;
              if (!session.session_end) {
                setActiveSession(session);
              } else if (activeSession?.id === session.id) {
                setActiveSession(null);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(sessionsChannel);
      };
    } else {
      setSessions([]);
      setActiveSession(null);
      setStats(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('session_start', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching reading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('session_end', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setActiveSession(data);
    } catch (error) {
      console.error('Error fetching active session:', error);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data: allSessions, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!allSessions) {
        setStats(null);
        return;
      }

      const completedSessions = allSessions.filter(s => s.session_end);
      const totalPages = allSessions.reduce((sum, s) => sum + s.pages_read, 0);
      
      // Calculate total reading time in minutes
      const totalMinutes = completedSessions.reduce((sum, session) => {
        const start = new Date(session.session_start);
        const end = new Date(session.session_end!);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60);
      }, 0);

      // Count unique books
      const uniqueBooks = new Set(
        allSessions.map(s => `${s.book_title}|${s.book_author}`)
      );

      // Find favorite authors
      const authorCounts = allSessions.reduce((acc, session) => {
        acc[session.book_author] = (acc[session.book_author] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const favoriteAuthors = Object.entries(authorCounts)
        .map(([author, sessions]) => ({ author, sessions }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5);

      // Calculate reading streak
      const sessionDates = allSessions
        .map(s => new Date(s.session_start).toDateString())
        .filter((date, index, arr) => arr.indexOf(date) === index)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let streak = 0;
      let currentDate = new Date();
      
      for (const dateStr of sessionDates) {
        const sessionDate = new Date(dateStr);
        const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === streak) {
          streak++;
          currentDate = sessionDate;
        } else if (diffDays === streak + 1) {
          streak++;
          currentDate = sessionDate;
        } else {
          break;
        }
      }

      setStats({
        total_sessions: allSessions.length,
        total_pages_read: totalPages,
        total_reading_time: Math.round(totalMinutes),
        books_read: uniqueBooks.size,
        average_session_length: completedSessions.length > 0 ? Math.round(totalMinutes / completedSessions.length) : 0,
        favorite_authors: favoriteAuthors,
        reading_streak: streak,
        last_reading_date: sessionDates[0] || undefined
      });
    } catch (error) {
      console.error('Error fetching reading stats:', error);
    }
  };

  const startReadingSession = async (
    bookTitle: string,
    bookAuthor: string
  ): Promise<string | null> => {
    if (!user) return null;

    // End any existing active session first
    if (activeSession) {
      await endReadingSession(activeSession.id);
    }

    try {
      const { data, error } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: user.id,
          book_title: bookTitle,
          book_author: bookAuthor,
          session_start: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setActiveSession(data);
      toast({
        title: "Reading session started",
        description: `Started reading "${bookTitle}"`,
        variant: "success"
      });

      return data.id;
    } catch (error) {
      console.error('Error starting reading session:', error);
      toast({
        title: "Error starting session",
        description: "Failed to start reading session.",
        variant: "destructive"
      });
      return null;
    }
  };

  const endReadingSession = async (
    sessionId: string,
    pagesRead: number = 0,
    notes?: string,
    moodRating?: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('reading_sessions')
        .update({
          session_end: new Date().toISOString(),
          pages_read: pagesRead,
          notes,
          mood_rating: moodRating
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }

      toast({
        title: "Reading session ended",
        description: `Recorded ${pagesRead} pages read.`,
        variant: "success"
      });

      return true;
    } catch (error) {
      console.error('Error ending reading session:', error);
      toast({
        title: "Error ending session",
        description: "Failed to end reading session.",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateSessionProgress = async (
    sessionId: string,
    pagesRead: number,
    notes?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('reading_sessions')
        .update({
          pages_read: pagesRead,
          notes
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state if this is the active session
      if (activeSession?.id === sessionId) {
        setActiveSession(prev => prev ? { ...prev, pages_read: pagesRead, notes } : null);
      }

      return true;
    } catch (error) {
      console.error('Error updating session:', error);
      return false;
    }
  };

  const deleteSession = async (sessionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('reading_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Session deleted",
        description: "Reading session has been deleted.",
        variant: "success"
      });

      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error deleting session",
        description: "Failed to delete reading session.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    sessions,
    activeSession,
    stats,
    loading,
    startReadingSession,
    endReadingSession,
    updateSessionProgress,
    deleteSession,
    refetch: fetchSessions
  };
};