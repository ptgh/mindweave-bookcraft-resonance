import React, { memo, useState, useMemo } from "react";
import BookCard from "./BookCard";
import EmptyState from "./EmptyState";
import { StandardButton } from "./ui/standard-button";
import { Transmission } from "@/services/transmissionsService";
import { getOptimizedSettings } from "@/utils/performance";
import { ConceptualBridge } from "@/services/patternRecognition";

interface AIRecommendation {
  reason: string;
  cluster_connection: string;
}

interface TransmissionsListProps {
  transmissions: Transmission[];
  loading: boolean;
  onEdit: (book: Transmission) => void;
  onKeep: (book: Transmission) => void;
  onDiscard: (book: Transmission) => void;
  onAddNew: () => void;
  onAuthorClick?: (authorName: string) => void;
  getBookBridges?: (bookId: string) => ConceptualBridge[];
  aiRecommendations?: Map<string, AIRecommendation>;
}

const TransmissionsList = memo(({ 
  transmissions, 
  loading, 
  onEdit, 
  onKeep, 
  onDiscard, 
  onAddNew,
  onAuthorClick,
  getBookBridges,
  aiRecommendations
}: TransmissionsListProps) => {
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [optimisticTransmissions, setOptimisticTransmissions] = useState<Transmission[]>([]);

  // Get device-specific optimizations
  const optimizedSettings = useMemo(() => getOptimizedSettings(), []);

  // Keep optimistic list in sync with props
  React.useEffect(() => {
    setOptimisticTransmissions(transmissions);
  }, [transmissions]);

  const handleDiscard = async (book: Transmission) => {
    // Immediately remove from local state for instant feedback
    setOptimisticTransmissions(prev => prev.filter(t => t.id !== book.id));
    setDeletingIds(prev => new Set(prev).add(book.id));
    
    try {
      await onDiscard(book);
      // Clean up deletion state on success
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(book.id);
        return newSet;
      });
    } catch (error) {
      // Restore the book if deletion fails
      setOptimisticTransmissions(transmissions);
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(book.id);
        return newSet;
      });
    }
  };

  // Match Signal Archive layout: 3 columns max for proper breathing room
  const gridClasses = "grid gap-4 md:grid-cols-2 lg:grid-cols-3";

  if (loading && optimisticTransmissions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
          <div className={`w-6 h-6 rounded-full border-2 border-blue-400 ${optimizedSettings.reduceAnimations ? '' : 'animate-pulse'}`} />
        </div>
        <p className="text-slate-400">Loading transmissions...</p>
      </div>
    );
  }

  if (optimisticTransmissions.length === 0) {
    return (
      <EmptyState
        title="No signals yet"
        description="Begin mapping your intellectual journey through the books that shape you"
        action={
          <StandardButton
            onClick={onAddNew}
            variant="standard"
            className="touch-manipulation active:scale-95"
          >
            Log Your First Signal
          </StandardButton>
        }
      />
    );
  }

  return (
    <div className={gridClasses}>
      {optimisticTransmissions.map(book => {
        const bridges = getBookBridges ? getBookBridges(book.id.toString()) : [];
        const aiRec = aiRecommendations?.get(book.title.toLowerCase()) || 
                      aiRecommendations?.get(book.id.toString());
        
        return (
          <div 
            key={book.id}
            className={`transition-all ${optimizedSettings.reduceAnimations ? 'duration-150' : 'duration-300'} ${
              deletingIds.has(book.id) ? 'opacity-0 scale-95 pointer-events-none' : ''
            }`}
          >
              <BookCard
                id={book.id}
                title={book.title}
                author={book.author}
                status={book.status}
                tags={book.tags}
                rating={book.rating}
                coverUrl={book.cover_url}
                publisher_series={book.publisher_series}
                isbn={book.isbn}
                apple_link={book.apple_link}
                is_favorite={book.is_favorite}
                aiRecommendation={aiRec}
                onEdit={() => onEdit(book)}
                onKeep={() => onKeep(book)}
                onDiscard={() => handleDiscard(book)}
                onAuthorClick={onAuthorClick}
                bridges={bridges}
                publicationYear={book.publication_year}
                protagonist={book.protagonist}
                protagonistPortraitUrl={book.protagonist_portrait_url}
              />
          </div>
        );
      })}
    </div>
  );
});

TransmissionsList.displayName = 'TransmissionsList';

export default TransmissionsList;
