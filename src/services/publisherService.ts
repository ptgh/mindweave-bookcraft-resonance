
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
  const { data, error } = await supabase
    .from('publisher_books')
    .select(`
      *,
      publisher_series (*)
    `)
    .ilike('title', `%${title}%`)
    .ilike('author', `%${author}%`)
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.publisher_series as PublisherSeries;
};
