
import { useRef, useEffect } from "react";
import Header from "@/components/Header";
import AuthorMatrixHeader from "@/components/AuthorMatrixHeader";
import AuthorsList from "@/components/AuthorsList";
import AuthorBooksSection from "@/components/AuthorBooksSection";
import { useAuthorMatrix } from "@/hooks/useAuthorMatrix";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";

const AuthorMatrix = () => {
  const booksSectionRef = useRef<HTMLDivElement>(null);
  const {
    authors,
    selectedAuthor,
    authorBooks,
    loading,
    booksLoading,
    searchResults,
    currentPage,
    totalPages,
    highlightedAuthorId,
    setCurrentPage,
    handleAuthorSelect,
    handleSearchResults,
    handleSearchResultSelect,
    handleAuthorQueryChange,
    addToTransmissions
  } = useAuthorMatrix();

  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();

  // Scroll to books section on mobile when author is selected
  useEffect(() => {
    if (selectedAuthor && booksSectionRef.current) {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      if (isMobile) {
        setTimeout(() => {
          booksSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [selectedAuthor]);

    return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden">
        <Header />
        
        <main ref={mainContainerRef} className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
          <div ref={addFeatureBlockRef}>
            <AuthorMatrixHeader
              searchResults={searchResults}
              onResults={handleSearchResults}
              onResultSelect={handleSearchResultSelect}
              onQueryChange={handleAuthorQueryChange}
            />
          </div>

          <div ref={addFeatureBlockRef} className="feature-block flex items-center justify-between mb-3 sm:mb-6">
            <div>
              <h2 className="text-slate-200 text-base sm:text-xl font-medium mb-0.5 sm:mb-1">Authors</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Consciousness archives from the SF masters</p>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-4">
            <div ref={addFeatureBlockRef} className="feature-block lg:col-span-1">
              <AuthorsList
                authors={authors}
                selectedAuthor={selectedAuthor}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                highlightedAuthorId={highlightedAuthorId}
                onAuthorSelect={handleAuthorSelect}
                onPageChange={setCurrentPage}
              />
            </div>

            <div ref={(el) => { addFeatureBlockRef(el); booksSectionRef.current = el; }} className="feature-block lg:col-span-3 mt-4 lg:mt-0">
              <AuthorBooksSection
                selectedAuthor={selectedAuthor}
                authorBooks={authorBooks}
                booksLoading={booksLoading}
                onAddToTransmissions={addToTransmissions}
              />
            </div>
          </div>

          <div className="mt-8 sm:mt-12 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span>Matrix status: Operational</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AuthorMatrix;
