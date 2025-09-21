import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface BookCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionBook {
  id: string;
  collection_id: string;
  book_title: string;
  book_author: string;
  book_isbn?: string;
  cover_url?: string;
  added_at: string;
  personal_notes?: string;
}

export interface CollectionWithBooks extends BookCollection {
  books: CollectionBook[];
  book_count: number;
}

export const useBookCollections = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [collections, setCollections] = useState<CollectionWithBooks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCollections();
      
      // Set up real-time subscription
      const collectionsChannel = supabase
        .channel('collections-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'book_collections',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Collection updated:', payload);
            fetchCollections(); // Refetch to get updated data with book counts
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'collection_books'
          },
          (payload) => {
            console.log('Collection book updated:', payload);
            fetchCollections(); // Refetch to update book counts
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(collectionsChannel);
      };
    } else {
      setCollections([]);
      setLoading(false);
    }
  }, [user]);

  const fetchCollections = async () => {
    if (!user) return;

    try {
      // Fetch collections with book counts
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('book_collections')
        .select(`
          *,
          collection_books (
            id,
            collection_id,
            book_title,
            book_author,
            book_isbn,
            cover_url,
            added_at,
            personal_notes
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (collectionsError) throw collectionsError;

      const collectionsWithCounts = collectionsData.map(collection => ({
        ...collection,
        books: (collection.collection_books || []) as CollectionBook[],
        book_count: collection.collection_books?.length || 0
      }));

      setCollections(collectionsWithCounts);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast({
        title: "Error loading collections",
        description: "Failed to load your book collections.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async (
    name: string, 
    description?: string, 
    isPublic: boolean = false
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('book_collections')
        .insert({
          user_id: user.id,
          name,
          description,
          is_public: isPublic
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Collection created",
        description: `"${name}" has been created successfully.`,
      });

      return data.id;
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: "Error creating collection",
        description: "Failed to create the collection. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateCollection = async (
    collectionId: string,
    updates: Partial<Pick<BookCollection, 'name' | 'description' | 'is_public' | 'cover_image_url'>>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('book_collections')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', collectionId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Collection updated",
        description: "Your collection has been updated successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error updating collection:', error);
      toast({
        title: "Error updating collection",
        description: "Failed to update the collection. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteCollection = async (collectionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('book_collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Collection deleted",
        description: "The collection has been deleted successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: "Error deleting collection",
        description: "Failed to delete the collection. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const addBookToCollection = async (
    collectionId: string,
    book: {
      title: string;
      author: string;
      isbn?: string;
      coverUrl?: string;
    },
    personalNotes?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('collection_books')
        .insert({
          collection_id: collectionId,
          book_title: book.title,
          book_author: book.author,
          book_isbn: book.isbn,
          cover_url: book.coverUrl,
          personal_notes: personalNotes
        });

      if (error) throw error;

      toast({
        title: "Book added to collection",
        description: `"${book.title}" has been added to your collection.`,
      });

      return true;
    } catch (error) {
      console.error('Error adding book to collection:', error);
      toast({
        title: "Error adding book",
        description: "Failed to add the book to your collection. It might already be there.",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeBookFromCollection = async (bookId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('collection_books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      toast({
        title: "Book removed",
        description: "The book has been removed from your collection.",
      });

      return true;
    } catch (error) {
      console.error('Error removing book from collection:', error);
      toast({
        title: "Error removing book",
        description: "Failed to remove the book from your collection.",
        variant: "destructive"
      });
      return false;
    }
  };

  const fetchPublicCollections = async (): Promise<CollectionWithBooks[]> => {
    try {
      const { data, error } = await supabase
        .from('book_collections')
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          ),
          collection_books (
            id,
            collection_id,
            book_title,
            book_author,
            book_isbn,
            cover_url,
            added_at
          )
        `)
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data.map(collection => ({
        ...collection,
        books: (collection.collection_books || []) as CollectionBook[],
        book_count: collection.collection_books?.length || 0
      }));
    } catch (error) {
      console.error('Error fetching public collections:', error);
      return [];
    }
  };

  return {
    collections,
    loading,
    createCollection,
    updateCollection,
    deleteCollection,
    addBookToCollection,
    removeBookFromCollection,
    fetchPublicCollections,
    refetch: fetchCollections
  };
};