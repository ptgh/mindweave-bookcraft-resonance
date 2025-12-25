import React, { useState } from 'react';
import { BookOpen, Send, MessageCircle, Star, Quote, ThumbsUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useBookPosts, CreatePostData } from '@/hooks/useBookPosts';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { BookSearchAutocomplete } from './BookSearchAutocomplete';
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
  { value: 'discussion', label: 'Discussion', description: 'Start a conversation', icon: MessageCircle },
  { value: 'review', label: 'Review', description: 'Share your verdict', icon: Star },
  { value: 'quote', label: 'Quote', description: 'Highlight a passage', icon: Quote },
  { value: 'recommendation', label: 'Recommendation', description: 'Suggest to others', icon: ThumbsUp }
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
    book_isbn?: string;
    transmission_id?: number;
  }>({
    book_title: prefilledBook?.title || '',
    book_author: prefilledBook?.author || '',
    book_cover_url: prefilledBook?.cover_url || '',
    content: '',
    post_type: 'discussion',
    book_isbn: prefilledBook?.isbn,
    transmission_id: prefilledBook?.transmission_id
  });

  // Update form when prefilled data changes
  React.useEffect(() => {
    if (prefilledBook) {
      setFormData(prev => ({
        ...prev,
        book_title: prefilledBook.title,
        book_author: prefilledBook.author,
        book_cover_url: prefilledBook.cover_url || '',
        book_isbn: prefilledBook.isbn,
        transmission_id: prefilledBook.transmission_id
      }));
    }
  }, [prefilledBook]);

  const handleBookSelect = (book: {
    id: string;
    title: string;
    author: string;
    cover_url?: string;
    isbn?: string;
    transmission_id?: number;
  }) => {
    setFormData(prev => ({
      ...prev,
      book_title: book.title,
      book_author: book.author,
      book_cover_url: book.cover_url || '',
      book_isbn: book.isbn,
      transmission_id: book.transmission_id
    }));
  };

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
      book_isbn: formData.book_isbn,
      transmission_id: formData.transmission_id,
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
        post_type: 'discussion',
        book_isbn: undefined,
        transmission_id: undefined
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

  const clearBook = () => {
    setFormData(prev => ({
      ...prev,
      book_title: '',
      book_author: '',
      book_cover_url: '',
      book_isbn: undefined,
      transmission_id: undefined
    }));
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
          {/* Book Search or Selected Book */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Book *</Label>
            
            {formData.book_title ? (
              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                {formData.book_cover_url ? (
                  <img 
                    src={formData.book_cover_url}
                    alt={formData.book_title}
                    className="w-12 h-18 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-18 bg-slate-700 rounded flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{formData.book_title}</p>
                  <p className="text-xs text-slate-400 truncate">{formData.book_author}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearBook}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Change
                </Button>
              </div>
            ) : (
              <BookSearchAutocomplete
                onSelect={handleBookSelect}
                placeholder="Search your library or sci-fi books..."
              />
            )}
          </div>

          {/* Post Type */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Post Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {postTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, post_type: type.value }))}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all flex items-start gap-2",
                      formData.post_type === type.value
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 mt-0.5 flex-shrink-0",
                      formData.post_type === type.value ? "text-emerald-400" : "text-slate-500"
                    )} />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{type.label}</p>
                      <p className="text-xs text-slate-500">{type.description}</p>
                    </div>
                  </button>
                );
              })}
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
              disabled={isSubmitting || !formData.book_title}
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
