
import { memo } from "react";
import { ScifiAuthor } from "@/services/scifiAuthorsService";

interface AuthorCardProps {
  author: ScifiAuthor;
  isSelected: boolean;
  onSelect: (author: ScifiAuthor) => void;
}

const AuthorCard = memo(({ author, isSelected, onSelect }: AuthorCardProps) => {
  return (
    <div
      className={`bg-slate-800/50 border border-[rgba(255,255,255,0.15)] rounded-lg p-3 sm:p-4 hover:bg-slate-800/70 transition-colors cursor-pointer touch-manipulation ${
        isSelected ? 'ring-2 ring-blue-400' : ''
      }`}
      onClick={() => onSelect(author)}
      style={{
        boxShadow: "0 0 0px transparent"
      }}
    >
      <div className="font-medium text-slate-200 text-sm">{author.name}</div>
      <div className="text-xs text-slate-400 mt-1">{author.nationality}</div>
    </div>
  );
});

AuthorCard.displayName = 'AuthorCard';

export default AuthorCard;
