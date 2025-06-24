
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import BookBrowserHeader from "@/components/BookBrowserHeader";
import BookGrid from "@/components/BookGrid";
import BookBrowserEmpty from "@/components/BookBrowserEmpty";
import BookBrowserStatus from "@/components/BookBrowserStatus";
import { useBookBrowser } from "@/hooks/useBookBrowser";

const BookBrowser = () => {
  const {
    books,
    loading,
    visibleBooks,
    previouslyShownBooks,
    loadRandomBooks,
    addToTransmissions
  } = useBookBrowser();

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <BookBrowserHeader 
            loading={loading}
            onDiscover={loadRandomBooks}
          />

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-spin border-t-transparent" />
              </div>
              <p className="text-slate-400">Scanning the consciousness archive...</p>
            </div>
          ) : books.length > 0 ? (
            <BookGrid
              books={books}
              visibleBooks={visibleBooks}
              onAddToTransmissions={addToTransmissions}
            />
          ) : (
            <BookBrowserEmpty onScan={loadRandomBooks} />
          )}

          <BookBrowserStatus 
            booksCount={books.length}
            previouslyShownCount={previouslyShownBooks.size}
          />
        </main>
      </div>
    </AuthWrapper>
  );
};

export default BookBrowser;
