
import LoadingSkeleton from "@/components/LoadingSkeleton";
import AuthorCard from "@/components/AuthorCard";
import GSAPPagination from "@/components/GSAPPagination";
import { ScifiAuthor } from "@/services/scifiAuthorsService";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface AuthorsListProps {
  authors: ScifiAuthor[];
  selectedAuthor: ScifiAuthor | null;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  highlightedAuthorId?: string | null;
  onAuthorSelect: (author: ScifiAuthor) => void;
  onPageChange: (page: number) => void;
}

const AuthorsList = ({ 
  authors, 
  selectedAuthor, 
  loading, 
  currentPage, 
  totalPages, 
  highlightedAuthorId,
  onAuthorSelect, 
  onPageChange 
}: AuthorsListProps) => {
  const authorCardsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to add author card refs
  const addToAuthorRefs = (authorId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      authorCardsRef.current.set(authorId, el);
    } else {
      authorCardsRef.current.delete(authorId);
    }
  };

  // GSAP animations for author cards
  useEffect(() => {
    const cards = Array.from(authorCardsRef.current.values());
    if (cards.length > 0 && !loading) {
      // Initial state - hidden
      gsap.set(cards, { 
        opacity: 0, 
        y: 10 
      });

      // Animate in with stagger
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1,
        delay: 0.1
      });

      // Setup hover animations for author cards
      cards.forEach((card) => {
        const handleMouseEnter = () => {
          gsap.to(card, {
            borderColor: "#89b4fa",
            boxShadow: "0 0 8px #89b4fa66",
            duration: 0.3,
            ease: "power2.inOut"
          });
        };

        const handleMouseLeave = () => {
          gsap.to(card, {
            borderColor: "rgba(255, 255, 255, 0.15)",
            boxShadow: "0 0 0px transparent",
            duration: 0.3,
            ease: "power2.inOut"
          });
        };

        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);

        // Cleanup function stored on the element
        (card as any)._cleanupHover = () => {
          card.removeEventListener('mouseenter', handleMouseEnter);
          card.removeEventListener('mouseleave', handleMouseLeave);
        };
      });
    }

    // Cleanup function
    return () => {
      authorCardsRef.current.forEach((card) => {
        if (card && (card as any)._cleanupHover) {
          (card as any)._cleanupHover();
        }
      });
    };
  }, [authors, loading]);

  // Scroll to highlighted author
  useEffect(() => {
    if (highlightedAuthorId && containerRef.current) {
      const highlightedCard = authorCardsRef.current.get(highlightedAuthorId);
      if (highlightedCard) {
        highlightedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedAuthorId]);

  if (loading) {
    return <LoadingSkeleton type="author-card" count={10} />;
  }

  return (
    <>
      <div ref={containerRef} className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
        {authors.map((author) => (
          <div 
            key={author.id} 
            ref={addToAuthorRefs(author.id)}
            className={highlightedAuthorId === author.id ? 'ring-2 ring-blue-400 rounded-lg' : ''}
          >
            <AuthorCard
              author={author}
              isSelected={selectedAuthor?.id === author.id}
              onSelect={onAuthorSelect}
            />
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <GSAPPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default AuthorsList;
