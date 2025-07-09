// Apple Books service main exports
export * from './types';
export * from './api';
export * from './cache';
export * from './transformer';

// Re-export main functions for convenience
export { searchAppleBooks, searchAppleBooksByISBN, searchAppleBooksByTitleAuthor } from './api';
export { appleBooksCache } from './cache';
export { 
  transformAppleBookData, 
  generateAppleBooksWebUrl, 
  generateAppleBooksDeepLink, 
  canOpenAppleBooksApp 
} from './transformer';