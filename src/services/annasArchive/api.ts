import { supabase } from '@/integrations/supabase/client';
import { AnnasArchiveSearchParams, AnnasArchiveSearchResponse, AnnasArchiveBook } from './types';

// Anna's Archive API integration using Supabase Edge Function
export class AnnasArchiveAPI {
  static async searchBooks(params: AnnasArchiveSearchParams): Promise<AnnasArchiveSearchResponse> {
    console.log('🔍 Anna\'s Archive search params:', params);
    
    try {
      const { data, error } = await supabase.functions.invoke('annas-archive-search', {
        body: { searchParams: params }
      });

      if (error) {
        console.error('❌ Anna\'s Archive search error:', error);
        throw new Error(`Anna's Archive search failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from Anna\'s Archive search');
      }

      console.log('✅ Anna\'s Archive search successful:', data);
      
      return {
        books: data.books || [],
        total: data.total || 0,
        page: data.page || 1
      };
    } catch (error) {
      console.error('❌ Anna\'s Archive API error:', error);
      throw new Error('Failed to search Anna\'s Archive. Please try again later.');
    }
  }

  static async getDownloadLink(bookId: string): Promise<string> {
    console.log('📥 Getting download link for:', bookId);
    
    try {
      const { data, error } = await supabase.functions.invoke('annas-archive-search', {
        body: { action: 'download', bookId }
      });

      if (error) {
        console.error('❌ Anna\'s Archive download error:', error);
        throw new Error(`Download failed: ${error.message}`);
      }

      return data?.downloadUrl || '#';
    } catch (error) {
      console.error('❌ Anna\'s Archive download API error:', error);
      return '#';
    }
  }
}