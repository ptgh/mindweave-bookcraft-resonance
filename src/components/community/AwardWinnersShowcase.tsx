import React, { useState, useEffect, useCallback } from 'react';
import { Award, ExternalLink, Rocket, Sparkles, Eye, LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AWARD_WINNING_BOOKS, AWARD_CONFIG, AwardType, AwardBook } from '@/constants/sfAwards';
import EnhancedBookPreviewModal from '@/components/EnhancedBookPreviewModal';
import { EnrichedPublisherBook } from '@/services/publisherService';

// Award page URLs for external linking
const AWARD_URLS: Record<AwardType, string> = {
  hugo: 'https://www.thehugoawards.org/',
  nebula: 'https://nebulas.sfwa.org/',
  pkd: 'https://www.philipkdickaward.org/',
};

const AWARD_ICONS: Record<AwardType, LucideIcon> = {
  hugo: Rocket,
  nebula: Sparkles,
  pkd: Eye,
};

// Get books that won awards (filter to winners only for showcase)
const getShowcaseBooks = (): AwardBook[] => {
  return AWARD_WINNING_BOOKS
    .filter(book => book.awards.some(a => a.isWinner))
    .sort(() => Math.random() - 0.5);
};

interface ShowcaseCardProps {
  book: AwardBook;
  isVisible: boolean;
  onCardClick: () => void;
  onAwardClick: (e: React.MouseEvent, awardType: AwardType) => void;
}

const ShowcaseCard: React.FC<ShowcaseCardProps> = ({ 
  book, 
  isVisible, 
  onCardClick,
  onAwardClick 
}) => {
  const primaryAward = book.awards.find(a => a.isWinner) || book.awards[0];
  const config = AWARD_CONFIG[primaryAward.type];
  const IconComponent = AWARD_ICONS[primaryAward.type];
  return (
    <Card 
      onClick={onCardClick}
      className={`
        relative overflow-hidden cursor-pointer
        bg-slate-800/50 border-slate-700/50 hover:border-primary/40
        transition-all duration-500 ease-in-out
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        group h-full
      `}
    >
      {/* Award Type Badge - Prominent */}
      <div className={`absolute top-0 left-0 right-0 py-2 px-3 ${config.bgColor} border-b backdrop-blur-sm z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className={`w-4 h-4 ${config.color}`} />
            <span className={`text-xs font-semibold ${config.color}`}>
              {config.name}
            </span>
          </div>
          <button
            onClick={(e) => onAwardClick(e, primaryAward.type)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title={`Visit ${config.name} website`}
          >
            <ExternalLink className={`w-3.5 h-3.5 ${config.color}`} />
          </button>
        </div>
      </div>
      
      <div className="pt-12 p-4">
        {/* Year Badge */}
        <Badge variant="outline" className="mb-2 text-xs border-slate-600 text-slate-400">
          {primaryAward.year} Winner
        </Badge>
        
        {/* Book Info */}
        <h4 className="font-medium text-slate-200 text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {book.title}
        </h4>
        <p className="text-xs text-slate-400 mb-2">
          by {book.author}
        </p>
        
        {/* Category */}
        <p className="text-xs text-slate-500">
          {primaryAward.category}
        </p>
        
        {/* Multiple Awards Indicator */}
        {book.awards.length > 1 && (
          <div className="mt-2 flex gap-1">
            {book.awards
              .filter(a => a.type !== primaryAward.type)
              .slice(0, 2)
              .map((award, idx) => {
                const AwardIcon = AWARD_ICONS[award.type];
                return (
                  <span key={idx} title={AWARD_CONFIG[award.type].name}>
                    <AwardIcon className={`w-3.5 h-3.5 ${AWARD_CONFIG[award.type].color}`} />
                  </span>
                );
              })}
            {book.awards.length > 2 && (
              <span className="text-xs text-slate-500">+{book.awards.length - 2}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Hover indicator */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-slate-500">Click for details</span>
      </div>
    </Card>
  );
};

const AwardWinnersShowcase: React.FC = () => {
  const [displayedBooks, setDisplayedBooks] = useState<AwardBook[]>([]);
  const [allBooks] = useState<AwardBook[]>(getShowcaseBooks);
  const [visibleStates, setVisibleStates] = useState<boolean[]>([true, true, true, true, true]);
  const [selectedBook, setSelectedBook] = useState<AwardBook | null>(null);
  const [currentIndices, setCurrentIndices] = useState<number[]>([0, 1, 2, 3, 4]);

  // Initialize with first 5 books
  useEffect(() => {
    if (allBooks.length >= 5) {
      setDisplayedBooks(allBooks.slice(0, 5));
      setCurrentIndices([0, 1, 2, 3, 4]);
    }
  }, [allBooks]);

  // Rotate cards at irregular intervals
  useEffect(() => {
    if (allBooks.length <= 5) return;

    const rotateCard = (slotIndex: number) => {
      // Fade out
      setVisibleStates(prev => {
        const next = [...prev];
        next[slotIndex] = false;
        return next;
      });

      // After fade out, swap book and fade in
      setTimeout(() => {
        setCurrentIndices(prev => {
          const next = [...prev];
          // Find next unused book index
          let newIndex = (Math.max(...prev) + 1) % allBooks.length;
          // Avoid duplicates
          while (prev.includes(newIndex)) {
            newIndex = (newIndex + 1) % allBooks.length;
          }
          next[slotIndex] = newIndex;
          return next;
        });

        setTimeout(() => {
          setVisibleStates(prev => {
            const next = [...prev];
            next[slotIndex] = true;
            return next;
          });
        }, 100);
      }, 500);
    };

    // Set up irregular intervals for each slot
    const intervals = [
      setInterval(() => rotateCard(0), 7000 + Math.random() * 3000),
      setInterval(() => rotateCard(1), 9000 + Math.random() * 4000),
      setInterval(() => rotateCard(2), 11000 + Math.random() * 3000),
      setInterval(() => rotateCard(3), 8000 + Math.random() * 5000),
      setInterval(() => rotateCard(4), 10000 + Math.random() * 4000),
    ];

    return () => intervals.forEach(clearInterval);
  }, [allBooks.length]);

  // Update displayed books when indices change
  useEffect(() => {
    setDisplayedBooks(currentIndices.map(i => allBooks[i]));
  }, [currentIndices, allBooks]);

  const handleCardClick = useCallback((book: AwardBook) => {
    setSelectedBook(book);
  }, []);

  const handleAwardClick = useCallback((e: React.MouseEvent, awardType: AwardType) => {
    e.stopPropagation();
    window.open(AWARD_URLS[awardType], '_blank', 'noopener,noreferrer');
  }, []);

  if (displayedBooks.length < 5) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Award className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-medium text-slate-200">Award-Winning Sci-Fi</h2>
        <div className="flex items-center gap-1.5 ml-2" aria-label="Award types">
          <Rocket className="w-4 h-4 text-amber-400" aria-label="Hugo Award" />
          <Sparkles className="w-4 h-4 text-purple-400" aria-label="Nebula Award" />
          <Eye className="w-4 h-4 text-cyan-400" aria-label="Philip K. Dick Award" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {displayedBooks.map((book, idx) => (
          <ShowcaseCard
            key={`${book.title}-${idx}`}
            book={book}
            isVisible={visibleStates[idx]}
            onCardClick={() => handleCardClick(book)}
            onAwardClick={handleAwardClick}
          />
        ))}
      </div>

      {/* Book Preview Modal */}
      {selectedBook && (
        <EnhancedBookPreviewModal
          onClose={() => setSelectedBook(null)}
          onAddBook={() => {}}
          book={{
            id: `award-${selectedBook.title.toLowerCase().replace(/\s+/g, '-')}`,
            title: selectedBook.title,
            author: selectedBook.author,
            series_id: 'awards',
            created_at: new Date().toISOString(),
            cover_url: null,
          } as EnrichedPublisherBook}
        />
      )}
    </section>
  );
};

export default AwardWinnersShowcase;
