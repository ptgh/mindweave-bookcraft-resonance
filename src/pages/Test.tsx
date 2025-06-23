
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import AuthorCityGrid from "@/components/AuthorCityGrid";
import { getPublisherSeries, getPublisherBooks, PublisherSeries, EnrichedPublisherBook } from "@/services/publisherService";
import { saveTransmission } from "@/services/transmissionsService";
import { useToast } from "@/hooks/use-toast";

// Transform publisher data to author data
interface AuthorData {
  name: string;
  books: EnrichedPublisherBook[];
}

const Test = () => {
  const [allAuthors, setAllAuthors] = useState<AuthorData[]>([]);
  const { toast } = useToast();

  // Get all publisher series
  const { data: publisherSeries = [], isLoading: seriesLoading } = useQuery({
    queryKey: ['publisher-series'],
    queryFn: getPublisherSeries,
  });

  // Load all books and group by author
  useEffect(() => {
    const loadAllBooksAndGroupByAuthor = async () => {
      if (publisherSeries.length === 0) return;
      
      try {
        const allBooksPromises = publisherSeries.map(series => 
          getPublisherBooks(series.id)
        );
        const booksArrays = await Promise.all(allBooksPromises);
        const flatBooks = booksArrays.flat();
        
        // Group books by author
        const authorGroups = flatBooks.reduce((acc, book) => {
          if (!acc[book.author]) {
            acc[book.author] = [];
          }
          acc[book.author].push(book);
          return acc;
        }, {} as Record<string, EnrichedPublisherBook[]>);

        // Convert to array format
        const authorsData = Object.entries(authorGroups).map(([author, books]) => ({
          name: author,
          books
        }));

        setAllAuthors(authorsData);
      } catch (error) {
        console.error('Failed to load books:', error);
      }
    };

    loadAllBooksAndGroupByAuthor();
  }, [publisherSeries]);

  const handleAddFromAuthor = async (book: EnrichedPublisherBook) => {
    try {
      const newBook = {
        title: book.title,
        author: book.author,
        cover_url: book.cover_url || "",
        status: "want-to-read" as const,
        tags: [],
        notes: book.editorial_note || "",
        rating: {
          truth: false,
          confirmed: false,
          disrupted: false,
          rewired: false
        },
        publisher_series_id: book.series_id
      };
      
      await saveTransmission(newBook);
      toast({
        title: "Portal Activated",
        description: `"${book.title}" has been added to your transmissions.`,
      });
    } catch (error: any) {
      toast({
        title: "Transmission Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Header />
        
        {seriesLoading ? (
          <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
              <p className="text-slate-400">Initializing test matrix...</p>
            </div>
          </div>
        ) : (
          <AuthorCityGrid
            authors={allAuthors}
            onAddBook={handleAddFromAuthor}
          />
        )}
      </div>
    </AuthWrapper>
  );
};

export default Test;
