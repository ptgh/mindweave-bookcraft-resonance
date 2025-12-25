import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeaturedAuthor {
  name: string;
  transmission_count: number;
  nationality?: string;
  notable_works?: string[];
  bio?: string;
  wikipedia_url?: string;
}

export interface FeaturedBook {
  title: string;
  author: string;
  cover_url: string | null;
  post_count: number;
}

export interface FeaturedPost {
  id: string;
  content: string;
  book_title: string;
  likes_count: number;
  user_id: string;
}

export interface CommunityStats {
  total_members: number;
  posts_today: number;
  active_discussions: number;
}

export interface FeaturedContent {
  featured_author: FeaturedAuthor | null;
  featured_book: FeaturedBook | null;
  featured_post: FeaturedPost | null;
}

export function useFeaturedContent() {
  const [loading, setLoading] = useState(true);
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent | null>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);

  const fetchFeaturedContent = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_community_featured');
      
      if (error) throw error;
      
      const featured = data as {
        featured_author: FeaturedAuthor | Record<string, never>;
        featured_book: FeaturedBook | Record<string, never>;
        featured_post: FeaturedPost | Record<string, never>;
      };

      setFeaturedContent({
        featured_author: Object.keys(featured.featured_author || {}).length > 0 
          ? featured.featured_author as FeaturedAuthor 
          : null,
        featured_book: Object.keys(featured.featured_book || {}).length > 0 
          ? featured.featured_book as FeaturedBook 
          : null,
        featured_post: Object.keys(featured.featured_post || {}).length > 0 
          ? featured.featured_post as FeaturedPost 
          : null
      });
    } catch (error) {
      console.error('Error fetching featured content:', error);
      setFeaturedContent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCommunityStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_community_stats');
      
      if (error) throw error;
      
      setCommunityStats(data as unknown as CommunityStats);
    } catch (error) {
      console.error('Error fetching community stats:', error);
      setCommunityStats(null);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedContent();
    fetchCommunityStats();
  }, [fetchFeaturedContent, fetchCommunityStats]);

  return {
    loading,
    featuredContent,
    communityStats,
    refetch: () => {
      fetchFeaturedContent();
      fetchCommunityStats();
    }
  };
}
