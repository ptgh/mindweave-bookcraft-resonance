
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
    badge_emoji: string;
  };
}

export const saveTransmission = async (transmission: Omit<Transmission, 'id' | 'user_id' | 'created_at'>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
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
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Save transmission error:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Save transmission failed:', error);
    throw error;
  }
};

export const updateTransmission = async (id: number, transmission: Partial<Omit<Transmission, 'id' | 'user_id' | 'created_at'>>) => {
  try {
    const updateData: any = {};
    
    if (transmission.title !== undefined) updateData.title = transmission.title;
    if (transmission.author !== undefined) updateData.author = transmission.author;
    if (transmission.cover_url !== undefined) updateData.cover_url = transmission.cover_url;
    if (transmission.tags !== undefined) updateData.tags = JSON.stringify(transmission.tags);
    if (transmission.rating !== undefined) updateData.resonance_labels = JSON.stringify(transmission.rating);
    if (transmission.notes !== undefined) updateData.notes = transmission.notes;
    if (transmission.publisher_series_id !== undefined) updateData.publisher_series_id = transmission.publisher_series_id;

    const { data, error } = await supabase
      .from('transmissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update transmission error:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Update transmission failed:', error);
    throw error;
  }
};

export const getTransmissions = async (): Promise<Transmission[]> => {
  try {
    console.log('Fetching transmissions...');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user found, returning empty array');
      return [];
    }

    const { data, error } = await supabase
      .from('transmissions')
      .select(`
        *,
        publisher_series (
          id,
          name,
          publisher,
          badge_emoji
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get transmissions error:', error);
      throw error;
    }
    
    console.log('Transmissions fetched:', data?.length || 0);
    
    if (!data) {
      return [];
    }
    
    return data.map(item => ({
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
    console.error('Get transmissions failed:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

export const deleteTransmission = async (id: number) => {
  try {
    const { error } = await supabase
      .from('transmissions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete transmission error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Delete transmission failed:', error);
    throw error;
  }
};
