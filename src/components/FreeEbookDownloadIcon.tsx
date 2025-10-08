import { useState, useEffect, useRef } from "react";
import { Loader2, Archive } from "lucide-react";
import { searchFreeEbooks, EbookSearchResult } from "@/services/freeEbookService";
import FreeEbookModal from "./FreeEbookModal";
import gsap from "gsap";

interface FreeEbookDownloadIconProps {
  title: string;
  author: string;
  isbn?: string;
  className?: string;
  onAvailabilityChange?: (hasLinks: boolean) => void;
}

const FreeEbookDownloadIcon = ({ title, author, isbn, className = "", onAvailabilityChange }: FreeEbookDownloadIconProps) => {
  const [ebookData, setEbookData] = useState<EbookSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let isMounted = true;

    const searchForFreeEbooks = async () => {
      try {
        // Use cache by default for card-level icon; preview modal will force refresh
        const result = await searchFreeEbooks(title, author, isbn);
        if (isMounted) {
          setEbookData(result);
        }
      } catch (error) {
        console.error('Error searching for free ebooks:', error);
        if (isMounted) {
          setEbookData({ hasLinks: false });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    searchForFreeEbooks();

    return () => {
      isMounted = false;
    };
  }, [title, author, isbn]);

  // Add GSAP animation on mount - only entrance animation, no pulsing
  useEffect(() => {
    if (buttonRef.current && ebookData?.hasLinks) {
      gsap.from(buttonRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
      });
    }
  }, [ebookData?.hasLinks]);

  // Notify parent when availability changes
  useEffect(() => {
    if (onAvailabilityChange && !isLoading) {
      onAvailabilityChange(!!ebookData?.hasLinks);
    }
  }, [ebookData?.hasLinks, isLoading, onAvailabilityChange]);

  const handleClick = () => {
    if (ebookData?.hasLinks) {
      setIsModalOpen(true);
    }
  };

  // Show loading state with consistent sizing; keep space even if hidden later
  if (isLoading) {
    return (
      <button
        disabled
        className={`flex items-center justify-center px-2 py-1 bg-transparent border border-[rgba(255,255,255,0.1)] text-slate-400 text-xs rounded-md ${className}`}
        aria-label="Loading Internet Archive availability"
      >
        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
        <span className="text-[10px]">Internet Archive</span>
      </button>
    );
  }

  // Don't render if no links found
  if (!ebookData?.hasLinks) {
    return null;
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`flex items-center justify-center px-2 py-1 bg-transparent border border-[rgba(255,255,255,0.1)] text-slate-400 text-xs rounded-md transition-all duration-300 ease-in-out hover:border-slate-300 hover:text-slate-200 ${className}`}
        title={`View "${title}" on Internet Archive`}
        aria-label={`View free ebook in Internet Archive: ${title}`}
      >
        <Archive className="w-3 h-3 mr-1.5 flex-shrink-0" />
        <span className="text-[10px] whitespace-nowrap">Internet Archive</span>
      </button>
      
      <FreeEbookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        author={author}
        ebookData={ebookData}
        isLoading={false}
      />
    </>
  );
};

export default FreeEbookDownloadIcon;