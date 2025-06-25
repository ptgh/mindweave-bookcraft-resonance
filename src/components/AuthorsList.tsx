
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
  onAuthorSelect: (author: ScifiAuthor) => void;
  onPageChange: (page: number) => void;
}

const AuthorsList = ({ 
  authors, 
  selectedAuthor, 
  loading, 
  currentPage, 
  totalPages, 
  onAuthorSelect, 
  onPageChange 
}: AuthorsListProps) => {
  const authorCardsRef = useRef<HTMLDivElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to add author card refs
  const addToAuthorRefs = (el: HTMLDivElement | null) => {
    if (el && !authorCardsRef.current.includes(el)) {
      authorCardsRef.current.push(el);
    }
  };

  // GSAP animations for author cards
  useEffect(() => {
    if (authorCardsRef.current.length > 0 && !loading) {
      // Initial state - hidden
      gsap.set(authorCardsRef.current, { 
        opacity: 0, 
        y: 10 
      });

      // Animate in with stagger
      gsap.to(authorCardsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1,
        delay: 0.1
      });

      // Setup hover animations for author cards
      authorCardsRef.current.forEach((card) => {
        if (card) {
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
        }
      });
    }

    // Cleanup function
    return () => {
      authorCardsRef.current.forEach((card) => {
        if (card && (card as any)._cleanupHover) {
          (card as any)._cleanupHover();
        }
      });
      authorCardsRef.current = [];
    };
  }, [authors, loading]);

  if (loading) {
    return <LoadingSkeleton type="author-card" count={10} />;
  }

  return (
    <>
      <div ref={containerRef} className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
        {authors.map((author, index) => (
          <div key={author.id} ref={addToAuthorRefs}>
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
