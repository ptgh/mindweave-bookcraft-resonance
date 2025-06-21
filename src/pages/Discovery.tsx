
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  googleBooksId: string;
}

const Discovery = () => {
  const [theme, setTheme] = useState<'clean' | 'speculative'>('speculative');
  const [books, setBooks] = useState<Book[]>([
    {
      id: '1',
      title: 'Dune',
      author: 'Frank Herbert',
      coverUrl: 'https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      googleBooksId: 'B1hSG45JCX4C'
    },
    {
      id: '2', 
      title: 'Dhalgren',
      author: 'Samuel R. Delany',
      coverUrl: 'https://books.google.com/books/content?id=koQWngEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      googleBooksId: 'koQWngEACAAJ'
    },
    {
      id: '3',
      title: 'I, Robot',
      author: 'Isaac Asimov',
      coverUrl: 'https://books.google.com/books/content?id=X7RtY4CVhYYC&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      googleBooksId: 'X7RtY4CVhYYC'
    }
  ]);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);

  const handleKeep = (book: Book) => {
    setSavedBooks(prev => [...prev, book]);
    setBooks(prev => prev.filter(b => b.id !== book.id));
  };

  const handleDiscard = (bookId: string) => {
    setBooks(prev => prev.filter(b => b.id !== bookId));
  };

  const themeClasses = {
    clean: {
      background: 'bg-white min-h-screen',
      text: 'text-gray-900',
      card: 'bg-white border border-gray-200 shadow-sm',
      header: 'text-gray-900',
      subtext: 'text-gray-600',
      button: {
        keep: 'bg-green-600 hover:bg-green-700 text-white',
        discard: 'bg-red-600 hover:bg-red-700 text-white'
      }
    },
    speculative: {
      background: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen',
      text: 'text-slate-200',
      card: 'bg-slate-800/50 border border-slate-700',
      header: 'text-slate-200',
      subtext: 'text-slate-400',
      button: {
        keep: 'bg-blue-600 hover:bg-blue-700 text-white',
        discard: 'bg-slate-600 hover:bg-slate-700 text-white'
      }
    }
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className={currentTheme.background}>
      <div className="container mx-auto px-6 py-8">
        {/* Header with theme toggle */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-2xl font-light tracking-wider ${currentTheme.header}`}>
              {theme === 'speculative' ? 'SIGNAL DISCOVERY' : 'Book Discovery'}
            </h1>
            <p className={`text-sm mt-1 ${currentTheme.subtext}`}>
              {theme === 'speculative' 
                ? 'Tuning into transmissions from the future-literate' 
                : 'Discover your next great read'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`text-sm ${currentTheme.text}`}>Clean</span>
            <Switch
              checked={theme === 'speculative'}
              onCheckedChange={(checked) => setTheme(checked ? 'speculative' : 'clean')}
            />
            <span className={`text-sm ${currentTheme.text}`}>Speculative</span>
          </div>
        </div>

        {/* Book cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {books.map(book => (
            <div key={book.id} className={`${currentTheme.card} rounded-lg p-6 hover:shadow-lg transition-all duration-200`}>
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-48 mb-4 rounded-lg overflow-hidden shadow-md">
                  <img 
                    src={book.coverUrl} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/128x192/6b7280/ffffff?text=${encodeURIComponent(book.title)}`;
                    }}
                  />
                </div>
                
                <h3 className={`text-lg font-medium mb-1 ${currentTheme.header}`}>
                  {book.title}
                </h3>
                <p className={`text-sm mb-4 ${currentTheme.subtext}`}>
                  {book.author}
                </p>
                
                <div className="flex space-x-3 w-full">
                  <Button
                    onClick={() => handleKeep(book)}
                    className={`flex-1 ${currentTheme.button.keep}`}
                  >
                    Keep
                  </Button>
                  <Button
                    onClick={() => handleDiscard(book.id)}
                    className={`flex-1 ${currentTheme.button.discard}`}
                  >
                    Discard
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {books.length === 0 && (
          <div className="text-center py-12">
            <div className={`text-lg font-medium mb-2 ${currentTheme.header}`}>
              All books reviewed!
            </div>
            <p className={`text-sm ${currentTheme.subtext}`}>
              {savedBooks.length > 0 
                ? `You kept ${savedBooks.length} book${savedBooks.length === 1 ? '' : 's'} for your library.`
                : 'No books were saved to your library.'
              }
            </p>
          </div>
        )}

        {/* Debug info for saved books */}
        {savedBooks.length > 0 && (
          <div className="mt-8 p-4 rounded-lg border border-dashed border-slate-600">
            <h3 className={`text-sm font-medium mb-2 ${currentTheme.header}`}>
              Saved to Library ({savedBooks.length}):
            </h3>
            <div className="space-y-1">
              {savedBooks.map(book => (
                <p key={book.id} className={`text-xs ${currentTheme.subtext}`}>
                  {book.title} by {book.author}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discovery;
