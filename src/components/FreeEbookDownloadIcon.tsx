import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { searchFreeEbooks, downloadFreeEbook, getPreferredDownloadUrl, EbookSearchResult } from "@/services/freeEbookService";

interface FreeEbookDownloadIconProps {
  title: string;
  author: string;
  isbn?: string;
  className?: string;
}

const FreeEbookDownloadIcon = ({ title, author, isbn, className = "" }: FreeEbookDownloadIconProps) => {
  const [ebookData, setEbookData] = useState<EbookSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const searchForFreeEbooks = async () => {
      setIsLoading(true);
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

  const handleDownload = async () => {
    if (!ebookData?.hasLinks) return;

    setIsDownloading(true);
    
    try {
      // Prefer Gutenberg over Archive
      const source = ebookData.gutenberg || ebookData.archive;
      if (!source) {
        throw new Error('No download source available');
      }

      const downloadInfo = getPreferredDownloadUrl(source.formats);
      if (!downloadInfo) {
        throw new Error('No compatible format available');
      }

      const sourceType = ebookData.gutenberg ? 'gutenberg' : 'archive';
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.${downloadInfo.format}`;
      
      const success = await downloadFreeEbook(downloadInfo.url, filename, sourceType);
      
      if (success) {
        toast({
          title: "Download initiated",
          description: `Free copy of "${title}" is being downloaded from ${sourceType === 'gutenberg' ? 'Project Gutenberg' : 'Internet Archive'}.`,
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Transmission link failed",
        description: "Unable to access free copy. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Don't render if no links found or still loading
  if (isLoading || !ebookData?.hasLinks) {
    return null;
  }

  const getTooltipText = () => {
    if (ebookData.gutenberg && ebookData.archive) {
      return "Download from Public Domain";
    } else if (ebookData.gutenberg) {
      return "Download from Project Gutenberg";
    } else {
      return "Download from Internet Archive";
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`group relative p-1.5 text-slate-400 hover:text-green-400 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={getTooltipText()}
      aria-label={`Download free ebook: ${title}`}
    >
      {isDownloading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4 group-hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.4)] transition-all duration-200" />
      )}
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {getTooltipText()}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
      </div>
    </button>
  );
};

export default FreeEbookDownloadIcon;