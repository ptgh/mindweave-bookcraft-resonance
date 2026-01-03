
import { searchGoogleBooks, getBookByISBN, GoogleBook } from "./googleBooks";
import { memoize } from "@/utils/performance";

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  subtitle?: string;
}

export interface BookSuggestion {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  subtitle?: string;
}

export interface EnhancedBookSuggestion {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  thumbnailUrl?: string;
  smallThumbnailUrl?: string;
  subtitle?: string;
  description?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  rating?: number;
  ratingsCount?: number;
  previewLink?: string;
  infoLink?: string;
  isbn?: string;
}

// Memoized search function for better performance
const memoizedSearchBooks = memoize(searchGoogleBooks);

// Known classic SF titles and authors that should always pass filter
const CLASSIC_SF_TITLES = [
  'earth abides', 'the day of the triffids', 'i am legend', 'the body snatchers',
  'a canticle for leibowitz', 'city', 'way station', 'the chrysalids',
  'the midwich cuckoos', 'the shrinking man', 'on the beach', 'alas babylon',
  'the long tomorrow', 'level 7', 'a wrinkle in time', 'flowers for algernon',
  'the demolished man', 'the stars my destination', 'more than human',
  'childhood\'s end', 'fahrenheit 451', 'the martian chronicles'
];

const CLASSIC_SF_AUTHORS = [
  'george r. stewart', 'george stewart', 'john wyndham', 'richard matheson',
  'jack finney', 'walter m. miller', 'clifford simak', 'clifford d. simak',
  'nevil shute', 'pat frank', 'leigh brackett', 'mordecai roshwald',
  'theodore sturgeon', 'alfred bester', 'madeleine l\'engle', 'daniel keyes'
];

// Enhanced sci-fi filtering function
const isSciFiBook = (book: any): boolean => {
  const title = (book.title || '').toLowerCase();
  const author = (book.author || '').toLowerCase();
  
  // Always accept known classic SF titles
  if (CLASSIC_SF_TITLES.some(classic => title.includes(classic))) {
    return true;
  }
  
  // Always accept known classic SF authors
  if (CLASSIC_SF_AUTHORS.some(classicAuthor => author.includes(classicAuthor))) {
    return true;
  }
  
  const sciFiKeywords = [
    'science fiction', 'sci-fi', 'cyberpunk', 'dystopian', 'utopian',
    'space opera', 'time travel', 'artificial intelligence', 'robot',
    'android', 'cyborg', 'alien', 'extraterrestrial', 'space',
    'future', 'futuristic', 'dystopia', 'utopia', 'post-apocalyptic',
    'steampunk', 'biopunk', 'nanopunk', 'alternate history',
    'virtual reality', 'genetic engineering', 'bioengineering',
    'terraforming', 'interstellar', 'galactic', 'quantum',
    'dimensional', 'parallel universe', 'multiverse', 'apocalyptic',
    'speculative fiction', 'fantasy', 'fiction / science fiction'
  ];

  const antiKeywords = [
    'climate policy', 'economics', 'politics', 'business',
    'self-help', 'biography', 'memoir',
    'religion', 'psychology', 'sociology',
    'anthropology', 'education', 'health', 'medical',
    'cookbook', 'travel', 'romance',
    'textbook', 'academic', 'reference'
  ];

  // Check categories first (most reliable)
  if (book.categories && Array.isArray(book.categories)) {
    const categoryText = book.categories.join(' ').toLowerCase();
    
    // Accept if contains sci-fi or fiction/general keywords in categories
    if (sciFiKeywords.some(keyword => categoryText.includes(keyword)) || 
        categoryText.includes('fiction')) {
      return true;
    }
    
    // Reject only if contains anti-keywords AND no fiction category
    if (antiKeywords.some(keyword => categoryText.includes(keyword)) &&
        !categoryText.includes('fiction')) {
      return false;
    }
  }

  // Check title and description
  const searchText = [
    book.title || '',
    book.subtitle || '',
    book.description || ''
  ].join(' ').toLowerCase();

  // Reject if contains strong anti-indicators
  const strongAntiKeywords = [
    'climate policy', 'economic analysis', 'political economy',
    'business strategy', 'policy making', 'government policy'
  ];
  
  if (strongAntiKeywords.some(keyword => searchText.includes(keyword))) {
    return false;
  }

  // Accept if contains sci-fi indicators or apocalyptic themes
  return sciFiKeywords.some(keyword => searchText.includes(keyword));
};

export const searchBooks = async (query: string): Promise<Book[]> => {
  try {
    // First try exact title search without SF modifiers (better for specific book lookups)
    let books = await memoizedSearchBooks(`intitle:"${query}"`, 10);
    
    // If no results, fall back to broader search with SF terms
    if (books.length === 0) {
      const sciFiQuery = `${query} science fiction OR sci-fi OR speculative fiction`;
      books = await memoizedSearchBooks(sciFiQuery, 10);
    }
    
    return books
      .filter(book => isSciFiBook(book))
      .map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        subtitle: book.subtitle
      }));
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
};

export const searchBooksEnhanced = async (query: string, maxResults = 10, startIndex = 0, authorFilter?: string): Promise<EnhancedBookSuggestion[]> => {
  try {
    // When searching by author, use inauthor for better author-specific results
    const searchQuery = authorFilter 
      ? `inauthor:"${authorFilter}"`
      : query;
    const books = await searchGoogleBooks(searchQuery, maxResults);
    
    // When filtering by author, be more lenient with SF filter
    // (authors already in our SF database are trusted to be SF authors)
    const shouldFilterSF = !authorFilter;
    
    return books
      .filter(book => {
        if (!book.title || !book.author) return false;
        // Skip SF filter if we're searching by a known SF author
        if (!shouldFilterSF) return true;
        return isSciFiBook(book);
      })
      .map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        thumbnailUrl: book.coverUrl,
        smallThumbnailUrl: book.coverUrl,
        subtitle: book.subtitle,
        description: book.description,
        publishedDate: book.publishedDate,
        pageCount: book.pageCount,
        categories: book.categories,
        rating: book.averageRating,
        ratingsCount: book.ratingsCount,
        previewLink: book.previewLink,
        infoLink: book.infoLink,
        isbn: book.isbn
      }));
  } catch (error) {
    console.error('Error searching books enhanced:', error);
    return [];
  }
};

export const getBookDetails = async (bookId: string): Promise<Book | null> => {
  try {
    const books = await memoizedSearchBooks(bookId, 1);
    const book = books[0];
    if (!book) return null;
    
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      subtitle: book.subtitle
    };
  } catch (error) {
    console.error('Error getting book details:', error);
    return null;
  }
};

export const searchBooksByISBN = async (isbn: string): Promise<Book | null> => {
  try {
    const book = await getBookByISBN(isbn);
    if (!book) return null;
    
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      subtitle: book.subtitle
    };
  } catch (error) {
    console.error('Error searching by ISBN:', error);
    return null;
  }
};
