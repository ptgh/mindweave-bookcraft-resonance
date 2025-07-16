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
}

const FreeEbookDownloadIcon = ({ title, author, isbn, className = "" }: FreeEbookDownloadIconProps) => {
  const [ebookData, setEbookData] = useState<EbookSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let isMounted = true;

    const searchForFreeEbooks = async () => {
      try {
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

  const handleClick = () => {
    if (ebookData?.hasLinks) {
      setIsModalOpen(true);
    }
  };

  // Show loading state briefly, then hide if no links found
  if (isLoading) {
    return (
      <div className={`p-1.5 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
      </div>
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
        className={`flex-1 px-3 py-1.5 bg-transparent border border-[rgba(34,197,94,0.3)] text-green-400 text-xs rounded-lg transition-all duration-300 ease-in-out hover:border-green-400 hover:bg-green-400/10 ${className}`}
        style={{ boxShadow: "0 0 0px transparent" }}
        title="View in Internet Archive"
        aria-label={`View free ebook in Internet Archive: ${title}`}
      >
        <Archive className="w-3 h-3 mr-2 inline" />
        Archive
      </button>
      
      <FreeEbookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        author={author}
        ebookData={ebookData}
      />
    </>
  );
};

export default FreeEbookDownloadIcon;