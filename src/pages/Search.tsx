import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import SearchResults from "@/components/SearchResults";
import { SearchResult } from "@/services/searchService";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";

const Search = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const { toast } = useEnhancedToast();
  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();

  const handleSelectResult = (result: SearchResult) => {
    switch (result.type) {
      case 'author':
        navigate(`/author-matrix?author=${encodeURIComponent(result.title)}`);
        break;
      case 'book':
        toast({
          title: "Book Selected",
          description: `"${result.title}" by ${result.author || 'Unknown'}`,
        });
        break;
      case 'transmission':
        navigate('/library');
        break;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main ref={mainContainerRef} className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div ref={addFeatureBlockRef} className="feature-block text-center mb-8">
              <h1 ref={heroTitleRef} className="text-3xl font-light text-slate-200 mb-2 tracking-wider">
                Search
              </h1>
              <p className="text-slate-400 text-sm">
                Discover authors, books, and your personal transmissions
              </p>
            </div>

            <div ref={addFeatureBlockRef} className="feature-block relative mb-8">
              <SearchInput 
                onResults={setResults}
                className="w-full"
                placeholder="Search the consciousness archive..."
              />
              <SearchResults 
                results={results}
                onSelectResult={handleSelectResult}
              />
            </div>

            {results.length === 0 && (
              <div ref={addFeatureBlockRef} className="feature-block text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
                </div>
                <h3 className="text-slate-300 text-lg font-medium mb-2">Start searching</h3>
                <p className="text-slate-400 text-sm">
                  Type to explore authors, books, and your personal library
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Search;
