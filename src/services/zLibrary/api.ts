import { supabase } from '@/integrations/supabase/client';
import { ZLibrarySearchParams, ZLibrarySearchResponse, ZLibraryBook } from './types';

// Real Z-Library API integration using Supabase Edge Function
export class ZLibraryAPI {
  static async searchBooks(params: ZLibrarySearchParams): Promise<ZLibrarySearchResponse> {
    console.log('🔍 Z-Library search params:', params);
    
    try {
      const { data, error } = await supabase.functions.invoke('zlibrary-search', {
        body: { searchParams: params }
      });

      if (error) {
        console.error('❌ Z-Library search error:', error);
        throw new Error(`Z-Library search failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from Z-Library search');
      }

      console.log('✅ Z-Library search successful:', data);
      
      return {
        books: data.books || [],
        total: data.total || 0,
        page: data.page || 1
      };
    } catch (error) {
      console.error('❌ Z-Library API error:', error);
      throw new Error('Failed to search Z-Library. Please try again later.');
    }
  }
  static async getDownloadLink(bookId: string): Promise<string> {
    console.log('📥 Getting download link for:', bookId);
    
    try {
      const { data, error } = await supabase.functions.invoke('zlibrary-search', {
        body: { action: 'download', bookId }
      });

      if (error) {
        console.error('❌ Z-Library download error:', error);
        throw new Error(`Download failed: ${error.message}`);
      }

      return data?.downloadUrl || '#';
    } catch (error) {
      console.error('❌ Z-Library download API error:', error);
      return '#';
    }
  }
}