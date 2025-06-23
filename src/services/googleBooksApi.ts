
export interface GoogleBook {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    publishedDate?: string;
    categories?: string[];
  };
}

export interface BookSuggestion {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  subtitle?: string;
  categories?: string[];
}

export const searchBooks = async (query: string, maxResults: number = 5, startIndex: number = 0): Promise<BookSuggestion[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    console.log(`Searching Google Books API for: "${query}"`);
    
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&startIndex=${startIndex}&printType=books&orderBy=relevance`;
    console.log('Google Books API URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Google Books API response not OK:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log('Google Books API raw response:', data);
    
    if (!data.items) {
      console.log('No items found in Google Books API response');
      return [];
    }
    
    const results = data.items.map((item: GoogleBook) => {
      const book: BookSuggestion = {
        id: item.id,
        title: item.volumeInfo.title || 'Unknown Title',
        author: item.volumeInfo.authors?.[0] || 'Unknown Author',
        coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 
                  item.volumeInfo.imageLinks?.smallThumbnail?.replace('http:', 'https:'),
        subtitle: item.volumeInfo.description,
        categories: item.volumeInfo.categories
      };
      return book;
    });
    
    console.log('Processed book results:', results);
    return results;
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
};

export const getBookDetails = async (bookId: string): Promise<GoogleBook | null> => {
  try {
    console.log(`Fetching book details for ID: ${bookId}`);
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
    
    if (!response.ok) {
      console.error('Failed to fetch book details:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('Book details received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching book details:', error);
    return null;
  }
};
