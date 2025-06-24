
import { memo, useState } from "react";
import BookCard from "./BookCard";
import EmptyState from "./EmptyState";
import { Button } from "./ui/button";
import { Transmission } from "@/services/transmissionsService";

interface TransmissionsListProps {
  transmissions: Transmission[];
  loading: boolean;
  onEdit: (book: Transmission) => void;
  onKeep: (book: Transmission) => void;
  onDiscard: (book: Transmission) => void;
  onAddNew: () => void;
}

const TransmissionsList = memo(({ 
  transmissions, 
  loading, 
  onEdit, 
  onKeep, 
  onDiscard, 
  onAddNew 
}: TransmissionsListProps) => {
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const handleDiscard = async (book: Transmission) => {
    // Add the book ID to deletingIds to show local feedback
    setDeletingIds(prev => new Set(prev).add(book.id));
    
    try {
      await onDiscard(book);
    } catch (error) {
      // If deletion fails, remove the ID from deletingIds
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(book.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
        </div>
        <p className="text-slate-400">Loading transmissions...</p>
      </div>
    );
  }

  if (transmissions.length === 0 && deletingIds.size === 0) {
    return (
      <EmptyState
        title="No signals yet"
        description="Begin mapping your intellectual journey through the books that shape you"
        action={
          <Button
            onClick={onAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white touch-manipulation active:scale-95"
          >
            Log Your First Signal
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {transmissions.map(book => (
        <div 
          key={book.id}
          className={`transition-all duration-300 ${
            deletingIds.has(book.id) ? 'opacity-50 scale-95 pointer-events-none' : ''
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
            onEdit={() => onEdit(book)}
            onKeep={() => onKeep(book)}
            onDiscard={() => handleDiscard(book)}
          />
        </div>
      ))}
    </div>
  );
});

TransmissionsList.displayName = 'TransmissionsList';

export default TransmissionsList;
