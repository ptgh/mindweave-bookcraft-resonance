import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BookPost {
  id: string;
  user_id: string;
  book_title: string;
  book_author: string;
  book_cover_url: string | null;
  book_isbn: string | null;
  transmission_id: number | null;
  content: string;
  post_type: 'discussion' | 'review' | 'quote' | 'recommendation';
  likes_count: number;
  comments_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  author_profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  user_has_liked?: boolean;
}

export interface BookPostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreatePostData {
  book_title: string;
  book_author: string;
  book_cover_url?: string;
  book_isbn?: string;
  transmission_id?: number;
  content: string;
  post_type: 'discussion' | 'review' | 'quote' | 'recommendation';
}

export function useBookPosts() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<BookPost[]>([]);

  const fetchPosts = useCallback(async (options?: {
    limit?: number;
    offset?: number;
    filterFollowing?: boolean;
    filterFeatured?: boolean;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('book_posts')
        .select(`
          *,
          author_profile:profiles!book_posts_user_id_fkey(id, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(options?.limit || 20);

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      if (options?.filterFeatured) {
        query = query.eq('is_featured', true);
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      // If user is logged in, check which posts they've liked
      let postsWithLikes = postsData || [];
      if (user && postsData && postsData.length > 0) {
        const postIds = postsData.map(p => p.id);
        const { data: likes } = await supabase
          .from('book_post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
        postsWithLikes = postsData.map(p => ({
          ...p,
          user_has_liked: likedPostIds.has(p.id)
        }));
      }

      // Filter by following if requested
      if (options?.filterFollowing && user) {
        const { data: following } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = new Set(following?.map(f => f.following_id) || []);
        followingIds.add(user.id); // Include own posts
        postsWithLikes = postsWithLikes.filter(p => followingIds.has(p.user_id));
      }

      setPosts(postsWithLikes as BookPost[]);
      return postsWithLikes as BookPost[];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createPost = useCallback(async (data: CreatePostData) => {
    if (!user) return null;

    try {
      const { data: newPost, error } = await supabase
        .from('book_posts')
        .insert({
          user_id: user.id,
          book_title: data.book_title,
          book_author: data.book_author,
          book_cover_url: data.book_cover_url || null,
          book_isbn: data.book_isbn || null,
          transmission_id: data.transmission_id || null,
          content: data.content,
          post_type: data.post_type
        })
        .select()
        .single();

      if (error) throw error;
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  }, [user]);

  const deletePost = useCallback(async (postId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('book_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }, [user]);

  const likePost = useCallback(async (postId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('book_post_likes')
        .insert({ post_id: postId, user_id: user.id });

      if (error) {
        if (error.code === '23505') {
          // Already liked, ignore
          return true;
        }
        throw error;
      }

      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, likes_count: p.likes_count + 1, user_has_liked: true }
          : p
      ));
      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  }, [user]);

  const unlikePost = useCallback(async (postId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('book_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, likes_count: Math.max(0, p.likes_count - 1), user_has_liked: false }
          : p
      ));
      return true;
    } catch (error) {
      console.error('Error unliking post:', error);
      return false;
    }
  }, [user]);

  const fetchComments = useCallback(async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('book_post_comments')
        .select(`
          *,
          author_profile:profiles!book_post_comments_user_id_fkey(id, display_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as BookPostComment[];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }, []);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!user) return null;

    try {
      const { data: newComment, error } = await supabase
        .from('book_post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content
        })
        .select()
        .single();

      if (error) throw error;

      // Update local post comments count
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));

      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }, [user]);

  return {
    posts,
    loading,
    fetchPosts,
    createPost,
    deletePost,
    likePost,
    unlikePost,
    fetchComments,
    addComment
  };
}
