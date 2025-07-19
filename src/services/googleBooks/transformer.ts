
import { GoogleBook, GoogleBooksVolumeInfo } from "./types";

export const transformGoogleBookData = (item: GoogleBooksVolumeInfo): GoogleBook | null => {
  if (!item?.volumeInfo?.title) return null;
  
  const { volumeInfo } = item;
  
  // Get the best available cover image with maximum quality
  const getCoverUrl = () => {
    const images = volumeInfo.imageLinks;
    if (!images) return undefined;
    
    // Prefer highest quality images and enhance them
    const baseUrl = images.extraLarge || 
                   images.large || 
                   images.medium || 
                   images.small || 
                   images.thumbnail || 
                   images.smallThumbnail;
    
    if (!baseUrl) return undefined;
    
    // Enhance the URL for maximum quality
    let enhancedUrl = baseUrl
      .replace('&edge=curl', '')
      .replace('&img=1', '')
      .replace('zoom=1', 'zoom=0')
      .replace('http://', 'https://');
    
    // Add zoom=0 if not present for best quality
    if (!enhancedUrl.includes('zoom=')) {
      const separator = enhancedUrl.includes('?') ? '&' : '?';
      enhancedUrl = `${enhancedUrl}${separator}zoom=0`;
    }
    
    console.log(`Cover URL for "${volumeInfo.title}": ${enhancedUrl}`);
    return enhancedUrl;
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
