
interface BookBrowserStatusProps {
  booksCount: number;
  previouslyShownCount: number;
}

const BookBrowserStatus = ({ booksCount, previouslyShownCount }: BookBrowserStatusProps) => {
  return (
    <div className="mt-12 text-center">
      <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <span>Archive status: {booksCount} sci-fi books discovered</span>
        <div className="w-1 h-1 bg-slate-600 rounded-full" />
        <span>Previously viewed: {previouslyShownCount} books</span>
        <div className="w-1 h-1 bg-slate-600 rounded-full" />
        <span>Enhanced caching: Active</span>
        <div className="w-1 h-1 bg-slate-600 rounded-full" />
        <span>Image optimization: Enabled</span>
      </div>
    </div>
  );
};

export default BookBrowserStatus;
