
import { GoogleBook, GoogleBooksVolumeInfo } from "./types";

export const transformGoogleBookData = (item: GoogleBooksVolumeInfo): GoogleBook | null => {
  if (!item?.volumeInfo?.title) return null;
  
  const { volumeInfo } = item;
  
  // Get the best available cover image
  const getCoverUrl = () => {
    const images = volumeInfo.imageLinks;
    if (!images) return undefined;
    
    // Prefer higher quality images
    return images.large || 
           images.medium || 
           images.small || 
           images.thumbnail?.replace('&edge=curl', '') || 
           images.smallThumbnail?.replace('&edge=curl', '');
  };
  
  return {
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
};
