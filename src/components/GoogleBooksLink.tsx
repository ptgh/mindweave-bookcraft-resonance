import { BookOpen } from "lucide-react";

interface GoogleBooksLinkProps {
  googleLink: string;
  title: string;
  className?: string;
}

const GoogleBooksLink = ({ googleLink, title, className = "" }: GoogleBooksLinkProps) => {
  if (!googleLink) return null;

  const handleClick = () => {
    window.open(googleLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center px-2 py-1 bg-transparent border border-[rgba(255,255,255,0.1)] text-slate-400 text-xs rounded-md transition-all duration-300 ease-in-out hover:border-slate-300 hover:text-slate-200 ${className}`}
      title={`View "${title}" in Google Books`}
      aria-label={`View ${title} in Google Books`}
    >
      <BookOpen className="w-3 h-3 mr-1.5" />
      <span className="text-[10px]">Google</span>
    </button>
  );
};

export default GoogleBooksLink;
