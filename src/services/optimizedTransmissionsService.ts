
import { supabase } from "@/integrations/supabase/client";
import { Transmission } from "./transmissionsService";

// Optimized version with better query performance and error handling
export const getTransmissionsOptimized = async (): Promise<Transmission[]> => {
  try {
    // Single optimized query using the new indexes
    const { data, error } = await supabase
      .from('transmissions')
      .select(`
        id,
        title,
        author,
        cover_url,
        tags,
        resonance_labels,
        notes,
        created_at,
        user_id,
        publisher_series_id,
        publisher_series!inner (
          id,
          name,
          publisher,
          description,
          logo_url,
          badge_emoji
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50); // Limit initial load for better performance

    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      title: item.title || '',
      author: item.author || '',
      status: 'read' as const,
      tags: item.tags ? JSON.parse(item.tags) : [],
      notes: item.notes || '',
      cover_url: item.cover_url || '',
      rating: item.resonance_labels ? JSON.parse(item.resonance_labels) : {},
      user_id: item.user_id || '',
      created_at: item.created_at,
      publisher_series_id: item.publisher_series_id,
      publisher_series: item.publisher_series
    }));
  } catch (error) {
    console.error('Error fetching transmissions:', error);
    throw error;
  }
};

// Optimized search function using database indexes
export const searchTransmissionsOptimized = async (query: string): Promise<Transmission[]> => {
  if (!query.trim()) return [];
  
  try {
    const { data, error } = await supabase
      .from('transmissions')
      .select(`
        *,
        publisher_series (
          id,
          name,
          publisher,
          description,
          logo_url,
          badge_emoji
        )
      `)
      .or(`title.fts.${query},author.fts.${query}`)
      .limit(20);

    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      title: item.title || '',
      author: item.author || '',
      status: 'read' as const,
      tags: item.tags ? JSON.parse(item.tags) : [],
      notes: item.notes || '',
      cover_url: item.cover_url || '',
      rating: item.resonance_labels ? JSON.parse(item.resonance_labels) : {},
      user_id: item.user_id || '',
      created_at: item.created_at,
      publisher_series_id: item.publisher_series_id,
      publisher_series: item.publisher_series
    }));
  } catch (error) {
    console.error('Error searching transmissions:', error);
    return [];
  }
};
