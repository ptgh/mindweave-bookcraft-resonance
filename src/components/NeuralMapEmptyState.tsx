import { BookOpen, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface NeuralMapEmptyStateProps {
  nodeCount: number;
  edgeCount: number;
  isFiltered: boolean;
  onClearFilter?: () => void;
}

const NeuralMapEmptyState = ({ 
  nodeCount, 
  edgeCount, 
  isFiltered,
  onClearFilter 
}: NeuralMapEmptyStateProps) => {
  const navigate = useNavigate();

  // Sparse state: few books
  if (nodeCount < 5 && nodeCount > 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 max-w-sm mx-4 text-center pointer-events-auto shadow-2xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-slate-200 font-medium mb-2">Growing Network</h3>
          <p className="text-slate-400 text-sm mb-4">
            You have {nodeCount} book{nodeCount !== 1 ? 's' : ''} in your collection. 
            Add more to discover richer connections between themes, authors, and eras.
          </p>
          <Button
            onClick={() => navigate('/book-browser')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add More Books
          </Button>
        </div>
      </div>
    );
  }

  // No connections state
  if (edgeCount === 0 && nodeCount >= 5) {
    return (
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-lg px-4 py-2 text-center shadow-lg">
          <p className="text-slate-400 text-xs">
            💡 Connections form from shared themes, subgenres, or authors. 
            <br className="hidden sm:block" />
            Try adding conceptual tags to your books.
          </p>
        </div>
      </div>
    );
  }

  // Empty after filtering
  if (isFiltered && nodeCount === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 max-w-sm mx-4 text-center pointer-events-auto shadow-2xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-700/50 border border-slate-600/30 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="text-slate-200 font-medium mb-2">No Matches</h3>
          <p className="text-slate-400 text-sm mb-4">
            No books match the selected filter. Try a different tag or clear the filter.
          </p>
          {onClearFilter && (
            <Button
              onClick={onClearFilter}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Clear Filter
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Completely empty state (handled in parent but fallback)
  if (nodeCount === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 max-w-sm mx-4 text-center pointer-events-auto shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-cyan-400 animate-pulse" />
          </div>
          <h3 className="text-slate-200 font-medium mb-2">No Signals Detected</h3>
          <p className="text-slate-400 text-sm mb-4">
            Add transmissions to your collection to visualize the neural network.
          </p>
          <Button
            onClick={() => navigate('/book-browser')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Your Collection
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default NeuralMapEmptyState;
