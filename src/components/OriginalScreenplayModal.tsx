import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, User, Calendar, Film, Clapperboard } from 'lucide-react';

interface OriginalScreenplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  filmTitle: string;
  director: string | null;
  year: number | null;
  writer?: string;
}

export const OriginalScreenplayModal: React.FC<OriginalScreenplayModalProps> = ({
  isOpen,
  onClose,
  filmTitle,
  director,
  year,
  writer,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-200 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Original Screenplay
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Card */}
          <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600/40 to-purple-800/50 flex items-center justify-center flex-shrink-0">
                <Clapperboard className="w-6 h-6 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-200 text-lg leading-tight">
                  {filmTitle}
                </h3>
                <p className="text-sm text-violet-300 mt-1">
                  Not based on published source material
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {(writer || director) && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-violet-400" />
                <span className="text-slate-400">Written by:</span>
                <span className="text-slate-200">{writer || director || 'Unknown'}</span>
              </div>
            )}
            
            {director && (
              <div className="flex items-center gap-2 text-sm">
                <Film className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">Directed by:</span>
                <span className="text-slate-200">{director}</span>
              </div>
            )}
            
            {year && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">Released:</span>
                <span className="text-slate-200">{year}</span>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-400 leading-relaxed">
              This film was created from an original screenplay rather than being adapted from a book, 
              short story, or other published work. The story was written specifically for the screen.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OriginalScreenplayModal;
