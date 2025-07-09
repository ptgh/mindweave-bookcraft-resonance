export interface AppleBook {
  id: string; // trackId
  title: string; // trackName
  author: string; // artistName
  description?: string; // description (HTML formatted)
  coverUrl?: string; // artworkUrl100 (can be scaled up)
  price?: number; // trackPrice or price
  currency?: string; // currency
  formattedPrice?: string; // formattedPrice
  storeUrl?: string; // trackViewUrl
  isbn?: string; // stored separately for lookup
}

export interface AppleBooksApiResponse {
  resultCount: number;
  results: AppleBooksResult[];
}

export interface AppleBooksResult {
  trackId: number;
  trackName?: string;
  artistName?: string;
  description?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  artworkUrl30?: string;
  trackPrice?: number;
  price?: number;
  currency?: string;
  formattedPrice?: string;
  trackViewUrl?: string;
  kind?: string;
  genres?: string[];
  releaseDate?: string;
}

export interface AppleBooksCacheEntry {
  data: AppleBook | null;
  timestamp: number;
  expires: number;
  isNoResult?: boolean; // Track when no result was found
}