
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  type: 'author-card' | 'book-card' | 'author-detail' | 'book-grid';
  count?: number;
}

const LoadingSkeleton = ({ type, count = 1 }: LoadingSkeletonProps) => {
  const renderAuthorCard = () => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
      <Skeleton className="h-4 w-3/4 bg-slate-700" />
      <Skeleton className="h-3 w-1/2 bg-slate-700" />
    </div>
  );

  const renderBookCard = () => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-start space-x-4">
        <Skeleton className="w-12 h-16 bg-slate-700 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 bg-slate-700" />
          <Skeleton className="h-3 w-1/2 bg-slate-700" />
          <Skeleton className="h-3 w-full bg-slate-700" />
          <Skeleton className="h-6 w-20 bg-slate-700 rounded" />
        </div>
      </div>
    </div>
  );

  const renderAuthorDetail = () => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2">
      <Skeleton className="h-6 w-1/2 bg-slate-700" />
      <Skeleton className="h-4 w-1/4 bg-slate-700" />
      <div className="space-y-1">
        <Skeleton className="h-3 w-full bg-slate-700" />
        <Skeleton className="h-3 w-full bg-slate-700" />
        <Skeleton className="h-3 w-3/4 bg-slate-700" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-4 w-1/3 bg-slate-700" />
        <Skeleton className="h-3 w-2/3 bg-slate-700" />
        <Skeleton className="h-3 w-1/2 bg-slate-700" />
      </div>
    </div>
  );

  const renderBookGrid = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => renderBookCard())}
    </div>
  );

  const renderItems = () => {
    switch (type) {
      case 'author-card':
        return Array.from({ length: count }).map((_, index) => (
          <div key={index}>{renderAuthorCard()}</div>
        ));
      case 'book-card':
        return Array.from({ length: count }).map((_, index) => (
          <div key={index}>{renderBookCard()}</div>
        ));
      case 'author-detail':
        return renderAuthorDetail();
      case 'book-grid':
        return renderBookGrid();
      default:
        return null;
    }
  };

  if (type === 'author-detail' || type === 'book-grid') {
    return <>{renderItems()}</>;
  }

  return <div className="space-y-2">{renderItems()}</div>;
};

export default LoadingSkeleton;
