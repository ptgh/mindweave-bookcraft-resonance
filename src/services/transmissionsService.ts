import { supabase } from "@/integrations/supabase/client";

export interface Transmission {
  id: number;
  title: string;
  author: string;
  status: "reading" | "read" | "want-to-read";
  tags: string[];
  notes: string;
  cover_url: string;
  rating: {
    truth?: boolean;
    confirmed?: boolean;
    disrupted?: boolean;
    rewired?: boolean;
  };
  user_id: string;
  created_at: string;
  publisher_series_id?: string;
  publisher_series?: {
    id: string;
    name: string;
    publisher: string;
    description: string;
    logo_url?: string;
    badge_emoji: string;
  } | null;
  isbn?: string;
  apple_link?: string;
  open_count?: number;
  publication_year?: number;
  narrative_time_period?: string;
  historical_context_tags?: string[];
}

export const saveTransmission = async (transmission: Omit<Transmission, 'id' | 'user_id' | 'created_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('Saving transmission for user:', user.email);

  // Check for existing transmission with same title and author to prevent duplicates
  const { data: existing } = await supabase
    .from('transmissions')
    .select('id')
    .eq('user_id', user.id)
    .eq('title', transmission.title)
    .eq('author', transmission.author)
    .maybeSingle();

  if (existing) {
    console.log('Transmission already exists, skipping duplicate:', transmission.title);
    throw new Error(`"${transmission.title}" is already in your transmissions`);
  }

  const { data, error } = await supabase
    .from('transmissions')
    .insert([{
      title: transmission.title,
      author: transmission.author,
      cover_url: transmission.cover_url,
      tags: JSON.stringify(transmission.tags),
      resonance_labels: JSON.stringify(transmission.rating),
      notes: transmission.notes,
      publisher_series_id: transmission.publisher_series_id,
      isbn: transmission.isbn,
      apple_link: transmission.apple_link,
      open_count: transmission.open_count || 0,
      user_id: user.id
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving transmission:', error);
    throw error;
  }
  
  console.log('Transmission saved successfully:', data);
  return data;
};

export const updateTransmission = async (id: number, transmission: Partial<Omit<Transmission, 'id' | 'user_id' | 'created_at'>>) => {
  const updateData: any = {};
  
  if (transmission.title !== undefined) updateData.title = transmission.title;
  if (transmission.author !== undefined) updateData.author = transmission.author;
  if (transmission.cover_url !== undefined) updateData.cover_url = transmission.cover_url;
  if (transmission.tags !== undefined) updateData.tags = JSON.stringify(transmission.tags);
  if (transmission.rating !== undefined) updateData.resonance_labels = JSON.stringify(transmission.rating);
  if (transmission.notes !== undefined) updateData.notes = transmission.notes;
  if (transmission.publisher_series_id !== undefined) updateData.publisher_series_id = transmission.publisher_series_id;
  if (transmission.isbn !== undefined) updateData.isbn = transmission.isbn;
  if (transmission.apple_link !== undefined) updateData.apple_link = transmission.apple_link;
  
  // Special handling for open_count increment
  if (transmission.open_count !== undefined) {
    const { data: currentData } = await supabase
      .from('transmissions')
      .select('open_count')
      .eq('id', id)
      .single();
    
    updateData.open_count = (currentData?.open_count || 0) + 1;
  }

  console.log('Updating transmission:', id, updateData);

  const { data, error } = await supabase
    .from('transmissions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating transmission:', error);
    throw error;
  }
  
  console.log('Transmission updated successfully:', data);
  return data;
};

// Improved version with better error handling and fallbacks
export const getTransmissions = async (): Promise<Transmission[]> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      throw new Error('Authentication error');
    }
    
    if (!user) {
      console.log('No authenticated user found');
      return []; // Return empty array instead of throwing error
    }

    console.log('Fetching transmissions for user:', user.email);

    const { data, error } = await supabase
      .from('transmissions')
      .select(`
        *
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching transmissions:', error);
      // Return empty array on error instead of throwing
      return [];
    }
    
    console.log('Fetched transmissions:', data?.length || 0);
    
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
      publisher_series: null, // Set to null since we're not joining
      isbn: item.isbn,
      apple_link: item.apple_link,
      open_count: item.open_count || 0,
      publication_year: item.publication_year,
      narrative_time_period: item.narrative_time_period,
      historical_context_tags: item.historical_context_tags
    }));
  } catch (error) {
    console.error('Unexpected error in getTransmissions:', error);
    return []; // Always return array to prevent UI crashes
  }
};

export const deleteTransmission = async (id: number) => {
  console.log('Deleting transmission:', id);
  
  const { error } = await supabase
    .from('transmissions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transmission:', error);
    throw error;
  }
  
  console.log('Transmission deleted successfully');
};