
import { Button } from "@/components/ui/button";

interface BookBrowserEmptyProps {
  onScan: () => void;
}

const BookBrowserEmpty = ({ onScan }: BookBrowserEmptyProps) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-cyan-400 animate-pulse" />
      </div>
      <h3 className="text-slate-300 text-lg font-medium mb-2">No Sci-Fi Books Found</h3>
      <p className="text-slate-400 text-sm mb-4">
        The archive scan returned empty. Try discovering new sci-fi books.
      </p>
      <Button
        onClick={onScan}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Scan Archive
      </Button>
    </div>
  );
};

export default BookBrowserEmpty;
