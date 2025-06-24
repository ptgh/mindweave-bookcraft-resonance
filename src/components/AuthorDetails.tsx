
import { memo } from "react";
import { ScifiAuthor } from "@/services/scifiAuthorsService";

interface AuthorDetailsProps {
  author: ScifiAuthor;
}

const AuthorDetails = memo(({ author }: AuthorDetailsProps) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
      <h2 className="text-sm font-medium text-slate-300 mb-1">{author.name}</h2>
      <p className="text-slate-400 text-sm mb-2">{author.nationality}</p>
      {author.bio && (
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-2 line-clamp-3">{author.bio}</p>
      )}
      {author.notable_works && author.notable_works.length > 0 && (
        <div>
          <h3 className="text-slate-300 font-medium text-sm mb-1">Notable Works:</h3>
          <ul className="text-slate-400 text-xs space-y-0.5">
            {author.notable_works.slice(0, 3).map((work, index) => (
              <li key={index}>• {work}</li>
            ))}
            {author.notable_works.length > 3 && (
              <li className="text-slate-500">+ {author.notable_works.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
});

AuthorDetails.displayName = 'AuthorDetails';

export default AuthorDetails;
