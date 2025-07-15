import { useState, useEffect } from "react";
import { X, ExternalLink, Smartphone, Globe, Plus, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrichedPublisherBook } from "@/services/publisherService";
import { AppleBook, searchAppleBooks, generateAppleBooksWebUrl, generateAppleBooksDeepLink, canOpenAppleBooksApp } from "@/services/appleBooks";
import { searchGoogleBooks } from "@/services/googleBooks";
import { searchAnnasArchive } from "@/services/annasArchive";
import type { AnnasArchiveBook } from "@/services/annasArchive";
import { useIsWebOnly } from "@/hooks/use-is-web-only";
import { useToast } from "@/hooks/use-toast";

interface EnhancedBookPreviewModalProps {
  book: EnrichedPublisherBook;
  onClose: () => void;
  onAddBook: (book: EnrichedPublisherBook) => void;
}

const EnhancedBookPreviewModal = ({ book, onClose, onAddBook }: EnhancedBookPreviewModalProps) => {
  const [appleBook, setAppleBook] = useState<AppleBook | null>(null);
  const [googleFallback, setGoogleFallback] = useState<any>(null);
  const [annasArchiveBooks, setAnnasArchiveBooks] = useState<AnnasArchiveBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [annasArchiveLoading, setAnnasArchiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingBooks, setDownloadingBooks] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const isWebOnly = useIsWebOnly();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBookData = async () => {
      setLoading(true);
      setError(null);

      console.log('🔍 Starting book preview fetch for:', {
        title: book.title,
        author: book.author,
        isbn: book.isbn
      });

      try {
        // Try Apple Books first
        console.log('📱 Attempting Apple Books search...');
        const appleResult = await searchAppleBooks(book.title, book.author, book.isbn);
        
        if (appleResult) {
          console.log('✅ Apple Books result found:', appleResult);
          setAppleBook(appleResult);
        } else {
          console.log('❌ No Apple Books result, falling back to Google Books');
          // Fallback to Google Books for additional data
          const googleBooks = await searchGoogleBooks(`${book.title} ${book.author}`, 1);
          if (googleBooks.length > 0) {
            console.log('📚 Google Books fallback result:', googleBooks[0]);
            setGoogleFallback(googleBooks[0]);
          }
        }

        // Search Anna's Archive if on web
        if (isWebOnly) {
          console.log('🌐 Searching Anna\'s Archive (web only)...');
          setAnnasArchiveLoading(true);
          try {
            const aaResult = await searchAnnasArchive(book.title, book.author, book.isbn);
            console.log('📖 Anna\'s Archive results:', aaResult);
            setAnnasArchiveBooks(aaResult.books);
          } catch (aaError) {
            console.error('Anna\'s Archive search failed:', aaError);
          } finally {
            setAnnasArchiveLoading(false);
          }
        }
      } catch (err) {
        console.error('💥 Error fetching book data:', err);
        setError('Failed to load book preview data');
      } finally {
        setLoading(false);
      }
    };

    fetchBookData();
  }, [book.title, book.author, book.isbn]);

  const handleBuyOnAppleBooks = async () => {
    if (!appleBook) return;

    const confirmed = window.confirm(
      "You are about to leave the app to purchase this book on Apple Books. Continue?"
    );

    if (!confirmed) return;

    try {
      // Try deep link first if on iOS
      if (canOpenAppleBooksApp()) {
        const deepLink = generateAppleBooksDeepLink(appleBook.id);
        window.location.href = deepLink;
        
        // Fallback to web if deep link fails (after a short delay)
        setTimeout(() => {
          const webUrl = generateAppleBooksWebUrl(appleBook.id);
          window.open(webUrl, '_blank', 'noopener,noreferrer');
        }, 1000);
      } else {
        // Open web store directly
        const webUrl = generateAppleBooksWebUrl(appleBook.id);
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }

      toast({
        title: "Opening Apple Books",
        description: "Redirecting to Apple Books store...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open Apple Books. Please try again.",
        variant: "destructive",
      });
    }
  };

  const displayData = appleBook || googleFallback || book;
  const hasAppleData = !!appleBook;
  const coverUrl = appleBook?.coverUrl || googleFallback?.coverUrl || book.cover_url;
  const description = appleBook?.description || googleFallback?.description || book.editorial_note;

  const handleAnnasArchiveDownload = async (aaBook: AnnasArchiveBook) => {
    const confirmed = window.confirm(
      `Download "${aaBook.title}" (${aaBook.extension.toUpperCase()}, ${aaBook.filesize})?\n\nNote: Please ensure you have the right to download this content in your jurisdiction.`
    );
    
    if (confirmed) {
      // Start download process
      setDownloadingBooks(prev => new Set([...prev, aaBook.id]));
      setDownloadProgress(prev => ({ ...prev, [aaBook.id]: 0 }));

      try {
        // Simulate download progress
        const progressInterval = setInterval(() => {
          setDownloadProgress(prev => {
            const currentProgress = prev[aaBook.id] || 0;
            if (currentProgress >= 100) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [aaBook.id]: Math.min(currentProgress + 10, 100) };
          });
        }, 200);

        // Create download link
        const link = document.createElement('a');
        link.href = aaBook.downloadUrl;
        link.download = `${aaBook.title.replace(/[^a-z0-9]/gi, '_')}.${aaBook.extension}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Complete download
        setTimeout(() => {
          setDownloadProgress(prev => ({ ...prev, [aaBook.id]: 100 }));
          setTimeout(() => {
            setDownloadingBooks(prev => {
              const newSet = new Set(prev);
              newSet.delete(aaBook.id);
              return newSet;
            });
            setDownloadProgress(prev => {
              const { [aaBook.id]: _, ...rest } = prev;
              return rest;
            });
          }, 1000);
        }, 2000);

        toast({
          title: "Download Complete",
          description: `${aaBook.extension.toUpperCase()} file downloaded successfully`,
        });
      } catch (error) {
        setDownloadingBooks(prev => {
          const newSet = new Set(prev);
          newSet.delete(aaBook.id);
          return newSet;
        });
        setDownloadProgress(prev => {
          const { [aaBook.id]: _, ...rest } = prev;
          return rest;
        });
        
        toast({
          title: "Download Failed",
          description: "Unable to download file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 border border-slate-600/30 rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/30">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
            <span className="text-slate-200 text-sm font-medium">Signal Preview</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-5 h-5 mx-auto mb-3 border-2 border-slate-400 animate-spin border-t-transparent rounded-full" />
              <p className="text-slate-400 text-sm">Loading signal data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <Button variant="outline" onClick={onClose} size="sm">Close</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Book details */}
              <div className="flex space-x-4">
                {/* Book cover */}
                <div className="flex-shrink-0 w-24 h-36 bg-slate-700/30 border border-slate-600/40 rounded overflow-hidden">
                  {coverUrl ? (
                    <img 
                      src={coverUrl} 
                      alt={displayData.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center text-slate-400 text-lg ${coverUrl ? 'hidden' : ''}`}>
                    📚
                  </div>
                </div>
                
                {/* Book info */}
                <div className="flex-1 space-y-2">
                  <div>
                    <h2 className="text-slate-200 font-medium text-lg leading-tight mb-1">
                      {displayData.title}
                    </h2>
                    <p className="text-slate-400 text-sm mb-2">{displayData.author}</p>
                    
                    {book.isbn && (
                      <p className="text-slate-500 text-xs font-mono">ISBN: {book.isbn}</p>
                    )}
                  </div>
                  
                  {/* Description/Synopsis */}
                  {description && (
                    <div className="space-y-2">
                      <h3 className="text-slate-300 text-sm font-medium">Synopsis</h3>
                      <div className="text-slate-400 text-xs leading-relaxed p-3 bg-slate-700/20 border border-slate-600/30 rounded max-h-32 overflow-y-auto">
                        {description.split('\n').map((paragraph, index) => (
                          <p key={index} className={index > 0 ? 'mt-2' : ''}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Anna's Archive Section - Web Only */}
              {isWebOnly && (
                <div className="border-t border-slate-700/30 pt-4">
                  <div className="bg-slate-700/20 border border-slate-600/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <Download className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300 text-sm font-medium">Free Digital Copies</span>
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 bg-slate-700/50">
                        Anna's Archive
                      </Badge>
                      {annasArchiveLoading && (
                        <div className="w-3 h-3 border border-slate-400 animate-spin border-t-transparent rounded-full" />
                      )}
                    </div>
                    
                    {annasArchiveBooks.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-slate-400 text-xs mb-2">Available formats for download:</p>
                        <div className="grid grid-cols-1 gap-2">
                           {annasArchiveBooks.slice(0, 3).map((aaBook) => {
                             const isDownloading = downloadingBooks.has(aaBook.id);
                             const progress = downloadProgress[aaBook.id] || 0;
                             
                             return (
                               <div 
                                 key={aaBook.id} 
                                 className="flex items-center justify-between p-2 bg-slate-800/30 border border-slate-600/20 rounded hover:bg-slate-700/30 transition-colors"
                               >
                                 <div className="flex items-center space-x-2 flex-1">
                                   <FileText className="w-3 h-3 text-slate-400" />
                                   <div className="flex-1 min-w-0">
                                     <div className="flex items-center space-x-2 mb-1">
                                       <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 bg-slate-700/50">
                                         {aaBook.extension.toUpperCase()}
                                       </Badge>
                                       <span className="text-slate-400 text-xs">{aaBook.filesize}</span>
                                     </div>
                                     {isDownloading && (
                                       <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                                         <div 
                                           className="h-full bg-gradient-to-r from-slate-400 to-slate-300 rounded-full transition-all duration-300 ease-out"
                                           style={{ width: `${progress}%` }}
                                         />
                                       </div>
                                     )}
                                   </div>
                                 </div>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => handleAnnasArchiveDownload(aaBook)}
                                   disabled={isDownloading}
                                   className="h-6 px-2 text-xs border-slate-500 text-slate-200 hover:bg-slate-500/60 hover:border-slate-400 bg-slate-700/40 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                   <Download className="w-3 h-3 mr-1" />
                                   {isDownloading ? 'Getting...' : 'Get'}
                                 </Button>
                               </div>
                             );
                           })}
                        </div>
                        <p className="text-slate-500 text-xs mt-2 italic">
                          Note: Ensure you have rights to download in your jurisdiction
                        </p>
                      </div>
                    ) : !annasArchiveLoading ? (
                      <p className="text-slate-400 text-xs">No free digital copies found</p>
                    ) : null}
                  </div>
                </div>
              )}
              
              {/* Apple Books Section */}
              {hasAppleData && appleBook && (
                <div className="border-t border-slate-700/30 pt-4">
                  <div className="bg-slate-700/20 border border-slate-600/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-slate-300 text-sm font-medium">Apple Books</p>
                          <p className="text-slate-400 text-xs">
                            {appleBook.formattedPrice || 
                             (appleBook.price === 0 ? 'Free' : 
                              `${appleBook.currency || '£'}${appleBook.price || 'N/A'}`)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleBuyOnAppleBooks}
                        className="h-6 px-2 text-xs bg-slate-600/70 hover:bg-slate-600/90 text-white border-0"
                      >
                        {canOpenAppleBooksApp() ? (
                          <>
                            <Smartphone className="w-3 h-3 mr-1" />
                            Buy
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3 mr-1" />
                            Buy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-2 p-4 border-t border-slate-700/30">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50 bg-transparent"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onAddBook(book);
              onClose();
            }}
            className="bg-slate-600/70 hover:bg-slate-600/90 text-white border-0"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Signal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookPreviewModal;