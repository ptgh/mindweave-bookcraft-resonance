
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
}

export const searchBooks = async (query: string): Promise<BookSuggestion[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&printType=books`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return data.items?.map((item: GoogleBook) => ({
      id: item.id,
      title: item.volumeInfo.title || 'Unknown Title',
      author: item.volumeInfo.authors?.[0] || 'Unknown Author',
      coverUrl: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail
    })) || [];
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
};

export const getBookDetails = async (bookId: string): Promise<GoogleBook | null> => {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching book details:', error);
    return null;
  }
};
