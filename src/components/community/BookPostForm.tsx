import React, { useState } from 'react';
import { X, BookOpen, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useBookPosts, CreatePostData } from '@/hooks/useBookPosts';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { cn } from '@/lib/utils';

interface BookPostFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  prefilledBook?: {
    title: string;
    author: string;
    cover_url?: string;
    isbn?: string;
    transmission_id?: number;
  };
}

const postTypes = [
  { value: 'discussion', label: 'Discussion', description: 'Start a conversation about this book' },
  { value: 'review', label: 'Review', description: 'Share your thoughts and rating' },
  { value: 'quote', label: 'Quote', description: 'Share a meaningful passage' },
  { value: 'recommendation', label: 'Recommendation', description: 'Recommend to others' }
] as const;

export const BookPostForm: React.FC<BookPostFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prefilledBook
}) => {
  const { createPost } = useBookPosts();
  const { toast } = useEnhancedToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<{
    book_title: string;
    book_author: string;
    book_cover_url: string;
    content: string;
    post_type: 'discussion' | 'review' | 'quote' | 'recommendation';
  }>({
    book_title: prefilledBook?.title || '',
    book_author: prefilledBook?.author || '',
    book_cover_url: prefilledBook?.cover_url || '',
    content: '',
    post_type: 'discussion'
  });

  // Update form when prefilled data changes
  React.useEffect(() => {
    if (prefilledBook) {
      setFormData(prev => ({
        ...prev,
        book_title: prefilledBook.title,
        book_author: prefilledBook.author,
        book_cover_url: prefilledBook.cover_url || ''
      }));
    }
  }, [prefilledBook]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.book_title.trim() || !formData.book_author.trim() || !formData.content.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    const postData: CreatePostData = {
      book_title: formData.book_title,
      book_author: formData.book_author,
      book_cover_url: formData.book_cover_url || undefined,
      book_isbn: prefilledBook?.isbn,
      transmission_id: prefilledBook?.transmission_id,
      content: formData.content,
      post_type: formData.post_type
    };

    const result = await createPost(postData);
    
    setIsSubmitting(false);
    
    if (result) {
      toast({
        title: 'Post created!',
        description: 'Your post has been shared with the community.',
        variant: 'default'
      });
      setFormData({
        book_title: '',
        book_author: '',
        book_cover_url: '',
        content: '',
        post_type: 'discussion'
      });
      onSuccess?.();
      onClose();
    } else {
      toast({
        title: 'Failed to create post',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-200 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Share Your Thoughts
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Book Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="book_title" className="text-slate-300 text-sm">
                Book Title *
              </Label>
              <Input
                id="book_title"
                value={formData.book_title}
                onChange={(e) => setFormData(prev => ({ ...prev, book_title: e.target.value }))}
                placeholder="Enter book title"
                className="bg-slate-800 border-slate-700 text-slate-200"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book_author" className="text-slate-300 text-sm">
                Author *
              </Label>
              <Input
                id="book_author"
                value={formData.book_author}
                onChange={(e) => setFormData(prev => ({ ...prev, book_author: e.target.value }))}
                placeholder="Author name"
                className="bg-slate-800 border-slate-700 text-slate-200"
                required
              />
            </div>
          </div>

          {/* Post Type */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Post Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {postTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, post_type: type.value }))}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    formData.post_type === type.value
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  )}
                >
                  <p className="text-sm font-medium text-slate-200">{type.label}</p>
                  <p className="text-xs text-slate-500">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-slate-300 text-sm">
              Your {formData.post_type} *
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder={
                formData.post_type === 'quote' 
                  ? 'Enter the quote...'
                  : formData.post_type === 'review'
                  ? 'What did you think of this book?'
                  : 'Share your thoughts...'
              }
              className="bg-slate-800 border-slate-700 text-slate-200 min-h-[120px] resize-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
            >
              {isSubmitting ? (
                'Posting...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Share Post
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
