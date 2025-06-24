
import LoadingSkeleton from "@/components/LoadingSkeleton";
import AuthorCard from "@/components/AuthorCard";
import PulseCirclePagination from "@/components/PulseCirclePagination";
import { ScifiAuthor } from "@/services/scifiAuthorsService";

interface AuthorsListProps {
  authors: ScifiAuthor[];
  selectedAuthor: ScifiAuthor | null;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onAuthorSelect: (author: ScifiAuthor) => void;
  onPageChange: (page: number) => void;
}

const AuthorsList = ({ 
  authors, 
  selectedAuthor, 
  loading, 
  currentPage, 
  totalPages, 
  onAuthorSelect, 
  onPageChange 
}: AuthorsListProps) => {
  if (loading) {
    return <LoadingSkeleton type="author-card" count={10} />;
  }

  return (
    <>
      <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
        {authors.map(author => (
          <AuthorCard
            key={author.id}
            author={author}
            isSelected={selectedAuthor?.id === author.id}
            onSelect={onAuthorSelect}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <PulseCirclePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default AuthorsList;
