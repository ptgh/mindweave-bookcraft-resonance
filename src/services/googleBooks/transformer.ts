
import { GoogleBook, GoogleBooksVolumeInfo } from "./types";

export const transformGoogleBookData = (item: GoogleBooksVolumeInfo): GoogleBook | null => {
  if (!item?.volumeInfo?.title) return null;
  
  const { volumeInfo } = item;
  
  // Get the best available cover image with maximum quality
  const getCoverUrl = () => {
    const images = volumeInfo.imageLinks;
    if (!images) {
      // Fallback to standard Google Books content endpoint using volume id
      if (item.id) {
        return `https://books.googleusercontent.com/books/content?id=${encodeURIComponent(item.id)}&printsec=frontcover&img=1&zoom=1&source=gbs_api`;
      }
      return undefined;
    }
    
    // Prefer highest quality images and enhance them
    const baseUrl = images.extraLarge || 
                   images.large || 
                   images.medium || 
                   images.small || 
                   images.thumbnail || 
                   images.smallThumbnail;
    
    if (!baseUrl) return undefined;
    
    // Normalize URL for reliability across browsers
    let normalizedUrl = baseUrl.replace(/^http:\/\//, 'https://');

    // If using Google Books content endpoint, ensure expected params are present
    if (/books\.google(?:usercontent)?\.com\/books\/content/.test(normalizedUrl)) {
      const hasImg = /[?&]img=/.test(normalizedUrl);
      const hasPrintsec = /[?&]printsec=/.test(normalizedUrl);

      if (!hasImg) {
        const sep = normalizedUrl.includes('?') ? '&' : '?';
        normalizedUrl = `${normalizedUrl}${sep}img=1`;
      }
      if (!hasPrintsec) {
        const sep = normalizedUrl.includes('?') ? '&' : '?';
        normalizedUrl = `${normalizedUrl}${sep}printsec=frontcover`;
      }
      // Do not force zoom; keep server defaults for best compatibility
    }

    return normalizedUrl;
  };
  
  const result = {
    id: item.id,
    title: volumeInfo.title,
    subtitle: volumeInfo.subtitle,
    author: volumeInfo.authors?.[0] || 'Unknown Author',
    description: volumeInfo.description,
    coverUrl: getCoverUrl(),
    publishedDate: volumeInfo.publishedDate,
    pageCount: volumeInfo.pageCount,
    categories: volumeInfo.categories,
    averageRating: volumeInfo.averageRating,
    ratingsCount: volumeInfo.ratingsCount,
    previewLink: volumeInfo.previewLink,
    infoLink: volumeInfo.infoLink
  };
  
  return result;
};
