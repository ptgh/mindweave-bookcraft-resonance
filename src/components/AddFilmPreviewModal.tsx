import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Film, Book, User, Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BookInfo {
  is_adaptation: boolean;
  book_title: string;
  book_author: string;
  source_type: string;
}

interface FilmToAdd {
  tmdb_id: number;
  title: string;
  year: number | null;
  poster_url: string | null;
  overview?: string;
}

interface AddFilmPreviewModalProps {
  film: FilmToAdd | null;
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export const AddFilmPreviewModal: React.FC<AddFilmPreviewModalProps> = ({
  film,
  isOpen,
  onClose,
  onAdded,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
  const [director, setDirector] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);

  const analyzeFilm = async () => {
    if (!film) return;
    
    setIsAnalyzing(true);
    try {
      // First get director from TMDB via edge function preview
      const { data, error } = await supabase.functions.invoke('add-external-film', {
        body: {
          tmdb_id: film.tmdb_id,
          title: film.title,
          year: film.year,
          poster_url: film.poster_url,
          preview_only: true, // New flag for preview mode
        }
      });
      
      if (error) throw error;
      
      if (data?.book_info) {
        setBookInfo(data.book_info);
        setDirector(data.director || null);
        setAnalyzed(true);
      }
    } catch (err) {
      console.error('Failed to analyze film:', err);
      toast.error('Failed to analyze film');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmAdd = async () => {
    if (!film) return;
    
    setIsAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke('add-external-film', {
        body: {
          tmdb_id: film.tmdb_id,
          title: film.title,
          year: film.year,
          poster_url: film.poster_url,
        }
      });
      
      if (error) throw error;
      
      toast.success(data.message || `Added "${film.title}" to collection!`);
      onAdded();
      handleClose();
    } catch (err: any) {
      if (err.message?.includes('already in collection')) {
        toast.info('Film already in collection');
      } else {
        toast.error('Failed to add film');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setBookInfo(null);
    setDirector(null);
    setAnalyzed(false);
    onClose();
  };

  // Auto-analyze when modal opens
  React.useEffect(() => {
    if (isOpen && film && !analyzed) {
      analyzeFilm();
    }
  }, [isOpen, film]);

  if (!film) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-200 flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            Add to Collection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Film Info */}
          <div className="flex gap-4">
            {film.poster_url ? (
              <img 
                src={film.poster_url} 
                alt={film.title}
                className="w-20 h-28 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-28 bg-slate-800 rounded-lg flex items-center justify-center">
                <Film className="w-8 h-8 text-slate-600" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-slate-200">
                {film.title} {film.year && `(${film.year})`}
              </h3>
              {director && (
                <p className="text-sm text-slate-400 mt-1">
                  Directed by {director}
                </p>
              )}
              {film.overview && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {film.overview}
                </p>
              )}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-slate-300">AI Source Analysis</span>
            </div>
            
            {isAnalyzing ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing book source...
              </div>
            ) : bookInfo ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Book className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-200">
                      {bookInfo.is_adaptation ? (
                        <>Based on "<span className="text-emerald-400">{bookInfo.book_title}</span>"</>
                      ) : (
                        <span className="text-amber-400">Original screenplay</span>
                      )}
                    </p>
                    {bookInfo.is_adaptation && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />
                        {bookInfo.book_author}
                        <span className="text-slate-600">•</span>
                        <span className="capitalize">{bookInfo.source_type}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                {!bookInfo.is_adaptation && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400/80">
                    <AlertCircle className="w-3 h-3" />
                    Not based on published source material
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Unable to analyze source</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button 
            onClick={confirmAdd} 
            disabled={isAnalyzing || isAdding}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm Add
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFilmPreviewModal;
