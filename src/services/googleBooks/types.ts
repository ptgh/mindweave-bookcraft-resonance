
export interface GoogleBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  subtitle?: string;
  description?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  previewLink?: string;
  infoLink?: string;
  isbn?: string;
}

export interface GoogleBooksApiResponse {
  items?: GoogleBooksVolumeInfo[];
  totalItems: number;
}

export interface GoogleBooksVolumeInfo {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    previewLink?: string;
    infoLink?: string;
    subtitle?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

export interface CacheEntry {
  data: GoogleBook[];
  timestamp: number;
  expires: number;
}
