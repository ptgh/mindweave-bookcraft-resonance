
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getScifiAuthors, getAuthorBooks, ScifiAuthor, AuthorBook } from "@/services/scifiAuthorsService";
import { saveTransmission } from "@/services/transmissionsService";
import { SearchResult } from "@/services/searchService";

const AuthorMatrix = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [authors, setAuthors] = useState<ScifiAuthor[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<ScifiAuthor | null>(null);
  const [authorBooks, setAuthorBooks] = useState<AuthorBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadAuthors();
    
    // Check if there's an author parameter in the URL
    const authorParam = searchParams.get('author');
    if (authorParam) {
      const author = authors.find(a => a.name.toLowerCase() === authorParam.toLowerCase());
      if (author) {
        handleAuthorSelect(author);
      }
    }
  }, [searchParams]);

  const loadAuthors = async () => {
    try {
      setLoading(true);
      const authorsData = await getScifiAuthors();
      setAuthors(authorsData);
    } catch (error: any) {
      toast({
        title: "Loading Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorSelect = async (author: ScifiAuthor) => {
    setSelectedAuthor(author);
    setSearchParams({ author: author.name });
    
    try {
      setBooksLoading(true);
      const books = await getAuthorBooks(author.id);
      setAuthorBooks(books);
    } catch (error: any) {
      toast({
        title: "Error Loading Books",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBooksLoading(false);
    }
  };

  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
    
    // Filter and show author results
    const authorResults = results.filter(r => r.type === 'author');
    if (authorResults.length > 0) {
      const matchingAuthors = authors.filter(author => 
        authorResults.some(result => result.title === author.name)
      );
      if (matchingAuthors.length > 0) {
        setAuthors([...matchingAuthors, ...authors.filter(a => !matchingAuthors.includes(a))]);
      }
    }
  };

  const handleSearchResultSelect = (result: SearchResult) => {
    if (result.type === 'author') {
      const author = authors.find(a => a.name === result.title);
      if (author) {
        handleAuthorSelect(author);
      }
    }
  };

  const addToTransmissions = async (book: AuthorBook) => {
    try {
      await saveTransmission({
        title: book.title,
        author: selectedAuthor?.name || 'Unknown',
        cover_url: book.cover_url || '',
        tags: book.categories?.join(', ') || '',
        resonance_labels: '',
        notes: book.description || '',
        status: 'want_to_read'
      });
      
      toast({
        title: "Signal Logged",
        description: `"${book.title}" has been added to your transmissions.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light text-slate-200 mb-2 tracking-wider">
              Author Matrix
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Navigate the consciousness territories of science fiction masters
            </p>
            
            <div className="max-w-2xl mx-auto relative">
              <SearchInput 
                onResults={handleSearchResults}
                placeholder="Search authors and books..."
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  {searchResults.filter(r => r.type === 'author').map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultSelect(result)}
                      className="w-full p-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                    >
                      <h3 className="font-medium text-slate-200">{result.title}</h3>
                      <p className="text-sm text-slate-400">{result.subtitle}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Authors List */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-medium text-slate-200 mb-4">Authors</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-blue-400 animate-spin border-t-transparent" />
                  <p className="text-slate-400 text-sm">Loading consciousness archives...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {authors.slice(0, 50).map(author => (
                    <button
                      key={author.id}
                      onClick={() => handleAuthorSelect(author)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedAuthor?.id === author.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="font-medium">{author.name}</div>
                      <div className="text-sm opacity-75">{author.nationality}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Author Details & Books */}
            <div className="lg:col-span-2">
              {selectedAuthor ? (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-light text-slate-200 mb-2">{selectedAuthor.name}</h2>
                    <p className="text-slate-400 mb-4">{selectedAuthor.nationality}</p>
                    {selectedAuthor.bio && (
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">{selectedAuthor.bio}</p>
                    )}
                    {selectedAuthor.notable_works && selectedAuthor.notable_works.length > 0 && (
                      <div>
                        <h3 className="text-slate-300 font-medium mb-2">Notable Works:</h3>
                        <ul className="text-slate-400 text-sm space-y-1">
                          {selectedAuthor.notable_works.map((work, index) => (
                            <li key={index}>• {work}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Books from Google Books API */}
                  <div>
                    <h3 className="text-xl font-medium text-slate-200 mb-4">Available Books</h3>
                    {booksLoading ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-blue-400 animate-spin border-t-transparent" />
                        <p className="text-slate-400 text-sm">Loading book data...</p>
                      </div>
                    ) : authorBooks.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {authorBooks.map(book => (
                          <Card key={book.id} className="p-4 bg-slate-800/50 border-slate-700">
                            <div className="flex space-x-3">
                              {book.cover_url && (
                                <img
                                  src={book.cover_url}
                                  alt={book.title}
                                  className="w-16 h-24 object-cover rounded bg-slate-700 flex-shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-200 mb-1">{book.title}</h4>
                                {book.subtitle && (
                                  <p className="text-sm text-slate-400 mb-2">{book.subtitle}</p>
                                )}
                                {book.description && (
                                  <p className="text-xs text-slate-500 mb-3 line-clamp-3">
                                    {book.description}
                                  </p>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => addToTransmissions(book)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                >
                                  Add to Transmissions
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-400">No books found for this author.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-cyan-400 animate-pulse" />
                  </div>
                  <h3 className="text-slate-300 text-lg font-medium mb-2">Select an Author</h3>
                  <p className="text-slate-400 text-sm">
                    Choose from the consciousness archive to explore their literary universe
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span>Archive depth: {authors.length} consciousness nodes</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Matrix status: Operational</span>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default AuthorMatrix;
