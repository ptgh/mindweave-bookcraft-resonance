
import { Label } from "@/components/ui/label";
import { CONCEPTUAL_TAGS } from "@/constants/conceptualTags";
import { AITagSuggestions } from "./AITagSuggestions";

interface ConceptualTagsSectionProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  bookTitle?: string;
  bookAuthor?: string;
  bookDescription?: string;
  userTaggingPatterns?: string[];
}

const ConceptualTagsSection = ({ 
  selectedTags, 
  onTagToggle,
  bookTitle,
  bookAuthor,
  bookDescription,
  userTaggingPatterns 
}: ConceptualTagsSectionProps) => {
  const canShowAISuggestions = bookTitle && bookAuthor && bookTitle.length > 2 && bookAuthor.length > 2;

  return (
    <div>
      <Label className="text-slate-300 text-sm mb-3 block">Conceptual Nodes</Label>
      <div className="grid grid-cols-2 gap-2">
        {CONCEPTUAL_TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => onTagToggle(tag)}
            className={`px-3 py-2 rounded-full text-xs transition-colors ${
              selectedTags.includes(tag)
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      
      {canShowAISuggestions && (
        <AITagSuggestions
          title={bookTitle}
          author={bookAuthor}
          description={bookDescription}
          currentTags={selectedTags}
          onTagSelect={onTagToggle}
          userTaggingPatterns={userTaggingPatterns}
        />
      )}
    </div>
  );
};

export default ConceptualTagsSection;
