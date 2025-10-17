import { useEffect } from 'react';

interface BookStructuredDataProps {
  title: string;
  author: string;
  isbn?: string;
  publicationYear?: number;
  coverUrl?: string;
  description?: string;
}

export function BookStructuredData({
  title,
  author,
  isbn,
  publicationYear,
  coverUrl,
  description,
}: BookStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: title,
      author: {
        '@type': 'Person',
        name: author,
      },
      ...(isbn && { isbn }),
      ...(publicationYear && { datePublished: publicationYear.toString() }),
      ...(coverUrl && { image: coverUrl }),
      ...(description && { description }),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    script.id = 'book-structured-data';
    
    // Remove existing script if present
    const existing = document.getElementById('book-structured-data');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('book-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [title, author, isbn, publicationYear, coverUrl, description]);

  return null;
}

interface WebsiteStructuredDataProps {
  name: string;
  description: string;
  url: string;
}

export function WebsiteStructuredData({ name, description, url }: WebsiteStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name,
      description,
      url,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${url}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    script.id = 'website-structured-data';
    
    const existing = document.getElementById('website-structured-data');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('website-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [name, description, url]);

  return null;
}

interface BreadcrumbStructuredDataProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    script.id = 'breadcrumb-structured-data';
    
    const existing = document.getElementById('breadcrumb-structured-data');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('breadcrumb-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [items]);

  return null;
}
