
import { supabase } from "@/integrations/supabase/client";

export interface PublisherSeries {
  id: string;
  name: string;
  publisher: string;
  description: string;
  logo_url?: string;
  badge_emoji: string;
  created_at: string;
}

export interface PublisherBook {
  id: string;
  series_id: string;
  title: string;
  author: string;
  isbn?: string;
  cover_url?: string;
  editorial_note?: string;
  created_at: string;
}

export const getPublisherSeries = async (): Promise<PublisherSeries[]> => {
  const { data, error } = await supabase
    .from('publisher_series')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const getPublisherBooks = async (seriesId: string): Promise<PublisherBook[]> => {
  const { data, error } = await supabase
    .from('publisher_books')
    .select('*')
    .eq('series_id', seriesId)
    .order('title');

  if (error) throw error;
  return data || [];
};

export const findMatchingPublisherSeries = async (title: string, author: string): Promise<PublisherSeries | null> => {
  console.log('Searching for publisher series match:', { title, author });
  
  // First try exact title and author match
  let { data, error } = await supabase
    .from('publisher_books')
    .select(`
      *,
      publisher_series (*)
    `)
    .eq('title', title)
    .eq('author', author)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error in exact match search:', error);
  }
  
  if (data?.publisher_series) {
    console.log('Found exact match:', data.publisher_series);
    return data.publisher_series as PublisherSeries;
  }

  // Try partial title match with exact author
  ({ data, error } = await supabase
    .from('publisher_books')
    .select(`
      *,
      publisher_series (*)
    `)
    .ilike('title', `%${title}%`)
    .eq('author', author)
    .limit(1)
    .maybeSingle());

  if (error) {
    console.error('Error in partial title match search:', error);
  }

  if (data?.publisher_series) {
    console.log('Found partial title match:', data.publisher_series);
    return data.publisher_series as PublisherSeries;
  }

  // Try exact title with partial author match
  ({ data, error } = await supabase
    .from('publisher_books')
    .select(`
      *,
      publisher_series (*)
    `)
    .eq('title', title)
    .ilike('author', `%${author}%`)
    .limit(1)
    .maybeSingle());

  if (error) {
    console.error('Error in partial author match search:', error);
  }

  if (data?.publisher_series) {
    console.log('Found partial author match:', data.publisher_series);
    return data.publisher_series as PublisherSeries;
  }

  console.log('No publisher series match found for:', { title, author });
  return null;
};
