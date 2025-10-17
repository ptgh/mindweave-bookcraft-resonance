import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'book';
  canonical?: string;
  noindex?: boolean;
}

const DEFAULT_TITLE = 'Leafnode - Your Personal Sci-Fi Library & Reading Companion';
const DEFAULT_DESCRIPTION = 'Track, discover, and explore science fiction literature with AI-powered insights, author connections, and personalized reading recommendations.';
const DEFAULT_IMAGE = '/og-image.jpg';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://leafnode.lovable.app';

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = ['science fiction', 'books', 'reading tracker', 'sci-fi', 'library', 'book recommendations'],
  image = DEFAULT_IMAGE,
  type = 'website',
  canonical,
  noindex = false,
}: SEOHeadProps) {
  const location = useLocation();
  
  const fullTitle = title ? `${title} | Leafnode` : DEFAULT_TITLE;
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  const fullCanonical = canonical || `${SITE_URL}${location.pathname}`;

  useEffect(() => {
    // Update title
    document.title = fullTitle;

    // Update or create meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));
    
    // Open Graph
    updateMetaTag('og:title', fullTitle, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:url', fullCanonical, 'property');
    updateMetaTag('og:image', fullImage, 'property');
    updateMetaTag('og:site_name', 'Leafnode', 'property');

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateMetaTag('twitter:title', fullTitle, 'name');
    updateMetaTag('twitter:description', description, 'name');
    updateMetaTag('twitter:image', fullImage, 'name');

    // Canonical link
    updateLink('canonical', fullCanonical);

    // Robots
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }
  }, [fullTitle, description, keywords, fullImage, type, fullCanonical, noindex]);

  return null;
}

function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

function updateLink(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  
  element.href = href;
}
