import React from 'react';
import Header from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { BookToScreenSection } from '@/components/BookToScreenSection';

const BookToScreen: React.FC = () => {
  return (
    <>
      <SEOHead 
        title="Book to Screen - SF Film Adaptations | Leafnode"
        description="Explore classic science fiction book-to-film adaptations. Watch trailers, discover streaming options, and compare ratings for iconic SF movies."
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main id="main-content" className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-light text-slate-200 mb-3">
              Book to <span className="text-amber-400">Screen</span>
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              Classic science fiction literature brought to life on screen
            </p>
          </div>

          <BookToScreenSection showTitle={false} />
        </main>
      </div>
    </>
  );
};

export default BookToScreen;
