import React, { useState } from 'react';
import { Heart, MessageCircle, Trash2, BookOpen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { BookPost, BookPostComment, useBookPosts } from '@/hooks/useBookPosts';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface BookPostCardProps {
  post: BookPost;
  onDelete?: () => void;
  className?: string;
}

const postTypeBadgeColors = {
  discussion: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  quote: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  recommendation: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
};

export const BookPostCard: React.FC<BookPostCardProps> = ({ post, onDelete, className }) => {
  const { user } = useAuth();
  const { likePost, unlikePost, fetchComments, addComment } = useBookPosts();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<BookPostComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isOwner = user?.id === post.user_id;
  const displayName = post.author_profile?.display_name || 'Anonymous Reader';
  const avatarUrl = post.author_profile?.avatar_url;

  const handleLikeToggle = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    if (post.user_has_liked) {
      await unlikePost(post.id);
    } else {
      await likePost(post.id);
    }
    setIsLiking(false);
  };

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      const fetchedComments = await fetchComments(post.id);
      setComments(fetchedComments);
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const result = await addComment(post.id, newComment);
    if (result) {
      setComments(prev => [...prev, result as unknown as BookPostComment]);
      setNewComment('');
    }
  };

  return (
    <div className={cn(
      "bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-slate-600">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-slate-700 text-slate-300">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-slate-200">{displayName}</p>
            <p className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", postTypeBadgeColors[post.post_type])}>
            {post.post_type}
          </Badge>
          {isOwner && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-slate-500 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Book Info */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-slate-900/50 rounded-lg">
        {post.book_cover_url ? (
          <img 
            src={post.book_cover_url} 
            alt={post.book_title}
            className="w-12 h-16 object-cover rounded shadow-md"
          />
        ) : (
          <div className="w-12 h-16 bg-slate-700 rounded flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-slate-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{post.book_title}</p>
          <p className="text-xs text-slate-400 truncate">by {post.book_author}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-slate-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-slate-700/50">
        <button
          onClick={handleLikeToggle}
          disabled={!user || isLiking}
          className={cn(
            "flex items-center gap-1.5 text-sm transition-colors",
            post.user_has_liked 
              ? "text-red-400" 
              : "text-slate-500 hover:text-red-400",
            (!user || isLiking) && "opacity-50 cursor-not-allowed"
          )}
        >
          <Heart className={cn("h-4 w-4", post.user_has_liked && "fill-current")} />
          <span>{post.likes_count}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-400 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments_count}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
          {loadingComments ? (
            <p className="text-sm text-slate-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-slate-500">No comments yet. Be the first!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={comment.author_profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                    {(comment.author_profile?.display_name || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-slate-900/50 rounded-lg p-2">
                  <p className="text-xs font-medium text-slate-300">
                    {comment.author_profile?.display_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-slate-400">{comment.content}</p>
                </div>
              </div>
            ))
          )}

          {user && (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button 
                size="sm" 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              >
                Post
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
