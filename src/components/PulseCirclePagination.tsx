
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PulseCirclePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PulseCirclePagination = ({ currentPage, totalPages, onPageChange }: PulseCirclePaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center space-x-4">
      <button
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300 touch-manipulation ${
          currentPage === 0 
            ? 'border-slate-700 text-slate-600 cursor-not-allowed' 
            : 'border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 active:scale-95'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <span className="text-slate-400 text-sm">
          {currentPage + 1} of {totalPages}
        </span>
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      </div>
      
      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        disabled={currentPage === totalPages - 1}
        className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300 touch-manipulation ${
          currentPage === totalPages - 1 
            ? 'border-slate-700 text-slate-600 cursor-not-allowed' 
            : 'border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 active:scale-95'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PulseCirclePagination;
