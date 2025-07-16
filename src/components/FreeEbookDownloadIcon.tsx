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
          setEbookData({});
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
    const hasAnyEbooks = !!(
      ebookData?.internetArchive?.length || 
      ebookData?.gutenberg?.length
    );
    if (hasAnyEbooks) {
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
  const hasAnyEbooks = !!(
    ebookData?.internetArchive?.length || 
    ebookData?.gutenberg?.length
  );
  
  if (!hasAnyEbooks) {
    return null;
  }

  const getTooltipText = () => {
    if (ebookData?.gutenberg?.length && ebookData?.internetArchive?.length) {
      return "Digital Libraries";
    } else if (ebookData?.gutenberg?.length) {
      return "Project Gutenberg";
    } else {
      return "Internet Archive";
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`group relative p-1.5 text-slate-400 hover:text-green-400 transition-all duration-200 hover:scale-110 ${className}`}
        title={getTooltipText()}
        aria-label={`Download free ebook: ${title}`}
      >
        <Download className="w-4 h-4 group-hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.4)] transition-all duration-200" />
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {getTooltipText()}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
        </div>
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