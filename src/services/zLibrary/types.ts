export interface ZLibraryBook {
  id: string;
  title: string;
  author: string;
  year?: string;
  language: string;
  filesize?: string;
  extension: string;
  downloadUrl: string;
  coverUrl?: string;
  publisher?: string;
  isbn?: string;
  description?: string;
}

export interface ZLibrarySearchParams {
  title?: string;
  author?: string;
  isbn?: string;
  language?: string;
  limit?: number;
}

export interface ZLibrarySearchResponse {
  books: ZLibraryBook[];
  total: number;
  page: number;
}

export interface ZLibraryError {
  message: string;
  code?: string;
}

export const SUPPORTED_FORMATS = ['pdf', 'epub', 'mobi', 'azw3', 'txt', 'djvu', 'fb2'] as const;
export type SupportedFormat = typeof SUPPORTED_FORMATS[number];