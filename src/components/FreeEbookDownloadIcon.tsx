import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { searchFreeEbooks, EbookSearchResult } from "@/services/freeEbookService";
import FreeEbookModal from "./FreeEbookModal";

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

  const getTooltipText = () => {
    if (ebookData.gutenberg && ebookData.archive) {
      return "Public Domain";
    } else if (ebookData.gutenberg) {
      return "Project Gutenberg";
    } else {
      return "Internet Archive";
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={handleClick}
          className={`group relative p-1.5 text-slate-400 hover:text-green-400 transition-all duration-200 hover:scale-110 ml-2 ${className}`}
          title={getTooltipText()}
          aria-label={`Download free ebook: ${title}`}
        >
          <Download className="w-4 h-4 group-hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.4)] transition-all duration-200" />
        </button>
        
        {/* Permanent tooltip with GSAP styling */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded opacity-100 pointer-events-none whitespace-nowrap z-10 animate-pulse">
          Internet Archive
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
        </div>
      </div>
      
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