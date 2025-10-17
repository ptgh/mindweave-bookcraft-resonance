import { ExternalLink } from "lucide-react";

interface AppleBooksLinkProps {
  appleLink: string;
  title: string;
  className?: string;
}

const AppleBooksLink = ({ appleLink, title, className = "" }: AppleBooksLinkProps) => {
  // Don't render if no valid link
  if (!appleLink) {
    return null;
  }

  // Only show Google Books if it's explicitly a Google Books URL
  // Everything else defaults to Apple Books (including trackIds, Apple URLs, etc.)
  const isGoogleBooks = appleLink.includes('books.google');
  const isAppleBooks = !isGoogleBooks;

  const handleClick = () => {
    // If appleLink is just a numeric trackId, convert to full URL
    const url = /^\d+$/.test(appleLink) 
      ? `https://books.apple.com/gb/book/id${appleLink}`
      : appleLink;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const serviceName = isAppleBooks ? 'Apple' : 'Google';
  const displayTitle = `View "${title}" in ${serviceName} Books`;

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center px-2 py-1 bg-transparent border border-[rgba(255,255,255,0.1)] text-slate-400 text-xs rounded-md transition-all duration-300 ease-in-out hover:border-slate-300 hover:text-slate-200 ${className}`}
      title={displayTitle}
      aria-label={displayTitle}
    >
      {isAppleBooks ? (
        <svg className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
      ) : (
        <svg className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.545 12.151L12.545 10.367L12.545 7.949C12.545 7.423 12.111 7 11.568 7C11.024 7 10.591 7.423 10.591 7.949L10.591 12.155L5.169 12.155C4.625 12.155 4.192 12.578 4.192 13.104C4.192 13.631 4.625 14.053 5.169 14.053L10.595 14.053L10.595 17.012C10.595 17.539 11.028 17.961 11.572 17.961C12.115 17.961 12.549 17.539 12.549 17.012L12.549 14.053L18.804 14.053C19.348 14.053 19.781 13.631 19.781 13.104C19.781 12.578 19.348 12.155 18.804 12.155L12.545 12.151Z"/>
        </svg>
      )}
      <span className="text-[10px]">{serviceName}</span>
    </button>
  );
};

export default AppleBooksLink;
