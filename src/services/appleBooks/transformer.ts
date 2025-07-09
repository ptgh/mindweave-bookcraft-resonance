import { AppleBook, AppleBooksResult } from "./types";

export const transformAppleBookData = (result: AppleBooksResult): AppleBook | null => {
  if (!result.trackName || !result.artistName) {
    return null; // Invalid result
  }
  
  // Scale up the artwork URL for better quality
  const scaleUpArtworkUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    // Replace the size in the URL (e.g., 100x100 -> 600x600)
    return url.replace(/\/(\d+)x\d+-75\./, '/600x600-75.');
  };
  
  // Clean and format description (remove basic HTML if needed)
  const cleanDescription = (desc?: string): string | undefined => {
    if (!desc) return undefined;
    // Basic HTML cleaning - preserve line breaks but remove most tags
    return desc
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();
  };
  
  return {
    id: result.trackId.toString(),
    title: result.trackName,
    author: result.artistName,
    description: cleanDescription(result.description),
    coverUrl: scaleUpArtworkUrl(result.artworkUrl100),
    price: result.trackPrice ?? result.price,
    currency: result.currency,
    formattedPrice: result.formattedPrice,
    storeUrl: result.trackViewUrl
  };
};

export const generateAppleBooksWebUrl = (trackId: string, countryCode = 'gb'): string => {
  return `https://books.apple.com/${countryCode}/book/id${trackId}`;
};

export const generateAppleBooksDeepLink = (trackId: string): string => {
  return `ibooks://assetid/${trackId}`;
};

export const canOpenAppleBooksApp = (): boolean => {
  // Check if we're on iOS and can potentially open the Apple Books app
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS;
};