
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthorMatrixHeader from "@/components/AuthorMatrixHeader";
import AuthorsList from "@/components/AuthorsList";
import AuthorBooksSection from "@/components/AuthorBooksSection";
import { useAuthorMatrix } from "@/hooks/useAuthorMatrix";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";

const AuthorMatrix = () => {
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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main ref={mainContainerRef} className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div ref={addFeatureBlockRef}>
            <AuthorMatrixHeader
              searchResults={searchResults}
              onResults={handleSearchResults}
              onResultSelect={handleSearchResultSelect}
              onQueryChange={handleAuthorQueryChange}
            />
          </div>

          <div ref={addFeatureBlockRef} className="feature-block flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-slate-200 text-lg sm:text-xl font-medium mb-1">Authors</h2>
              <p className="text-slate-400 text-sm">Consciousness archives from the SF masters</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
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

            <div ref={addFeatureBlockRef} className="feature-block lg:col-span-3 mt-6 lg:mt-0">
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

        <Footer />
      </div>
    </>
  );
};

export default AuthorMatrix;
