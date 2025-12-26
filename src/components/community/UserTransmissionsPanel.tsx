import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
import EnhancedBookPreviewModal from '@/components/EnhancedBookPreviewModal';
import type { EnrichedPublisherBook } from '@/services/publisherService';

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Transmission {
  id: number;
  title: string | null;
  author: string | null;
  cover_url: string | null;
}

interface UserTransmissionsPanelProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const UserTransmissionsPanel: React.FC<UserTransmissionsPanelProps> = ({
  user,
  isOpen,
  onClose,
  className
}) => {
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<EnrichedPublisherBook | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const booksRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isOpen && user.id) {
      const fetchTransmissions = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('transmissions')
            .select('id, title, author, cover_url')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;
          setTransmissions(data || []);
        } catch (error) {
          console.error('Error fetching user transmissions:', error);
          setTransmissions([]);
        } finally {
          setLoading(false);
        }
      };

      fetchTransmissions();
    }
  }, [isOpen, user.id]);

  // Animate panel
  useEffect(() => {
    if (!panelRef.current) return;

    if (isOpen) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, height: 0, y: -10 },
        { opacity: 1, height: 'auto', y: 0, duration: 0.3, ease: 'power2.out' }
      );

      // Animate books after panel opens
      if (transmissions.length > 0) {
        gsap.fromTo(
          booksRef.current.filter(Boolean),
          { opacity: 0, x: -10 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.2, 
            stagger: 0.05, 
            ease: 'power2.out',
            delay: 0.15
          }
        );
      }
    } else {
      gsap.to(panelRef.current, { 
        opacity: 0, 
        height: 0, 
        y: -10, 
        duration: 0.2, 
        ease: 'power2.in' 
      });
    }
  }, [isOpen, transmissions]);

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className={cn(
        "mt-3 p-4 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
              {(user.display_name || 'R').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-slate-200">
              {user.display_name || 'Reader'}
            </p>
            <p className="text-xs text-slate-500">
              {transmissions.length} books in library
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-slate-700/50 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-12 h-[72px] bg-slate-700/50 rounded animate-pulse flex-shrink-0" />
          ))}
        </div>
      ) : transmissions.length === 0 ? (
        <div className="text-center py-4">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No books in library yet</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {transmissions.map((book, index) => (
            <button
              key={book.id}
              ref={el => { booksRef.current[index] = el; }}
              className="flex-shrink-0 group cursor-pointer text-left"
              title={`${book.title} by ${book.author}`}
              onClick={() => setSelectedBook({
                id: `transmission-${book.id}`,
                series_id: 'user-library',
                title: book.title || 'Unknown',
                author: book.author || 'Unknown',
                cover_url: book.cover_url,
                created_at: new Date().toISOString()
              })}
            >
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title || 'Book cover'}
                  className="w-12 h-[72px] object-cover rounded shadow-md group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-12 h-[72px] bg-slate-700 rounded flex items-center justify-center shadow-md">
                  <BookOpen className="w-5 h-5 text-slate-500" />
                </div>
              )}
            </button>
          ))}
          {transmissions.length === 10 && (
            <div className="w-12 h-[72px] bg-slate-700/30 rounded flex items-center justify-center flex-shrink-0">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          )}
        </div>
      )}

      {selectedBook && (
        <EnhancedBookPreviewModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onAddBook={() => {}}
        />
      )}
    </div>
  );
};
