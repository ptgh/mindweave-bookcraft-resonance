import { ExternalLink } from "lucide-react";

interface AppleBooksLinkProps {
  appleLink: string;
  title: string;
  className?: string;
}

const AppleBooksLink = ({ appleLink, title, className = "" }: AppleBooksLinkProps) => {
  const handleClick = () => {
    // If appleLink is just a numeric trackId, convert to full URL
    const url = /^\d+$/.test(appleLink) 
      ? `https://books.apple.com/gb/book/id${appleLink}`
      : appleLink;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Detect if this is a Google Books link
  const isGoogleBooks = appleLink.includes('books.google');

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center px-2 py-1 bg-transparent border border-[rgba(255,255,255,0.1)] text-slate-400 text-xs rounded-md transition-all duration-300 ease-in-out hover:border-slate-300 hover:text-slate-200 ${className}`}
      title={`View "${title}" in ${isGoogleBooks ? 'Google Books' : 'Apple Books'}`}
      aria-label={`View ${title} in ${isGoogleBooks ? 'Google Books' : 'Apple Books'}`}
    >
      {isGoogleBooks ? (
        <svg className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.5 4.5c-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5-2.45 0-4.55.42-5.5 1.13v15.87c.95-.71 3.05-1.13 5.5-1.13 1.95 0 4.05.4 5.5 1.5 1.45-1.1 3.55-1.5 5.5-1.5 2.45 0 4.55.42 5.5 1.13V5.63c-.95-.71-3.05-1.13-5.5-1.13zM11 19.35c-1.45-1.1-3.55-1.5-5.5-1.5-1.28 0-2.46.17-3.5.43V7.53c.95-.48 2.09-.78 3.5-.78 1.95 0 4.05.4 5.5 1.5v11.1z"/>
        </svg>
      ) : (
        <svg className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
      )}
      <span className="text-[10px]">{isGoogleBooks ? 'Google' : 'Apple'}</span>
    </button>
  );
};

export default AppleBooksLink;
