
import { Label } from "@/components/ui/label";
import { CONCEPTUAL_TAGS } from "@/constants/conceptualTags";
import { AITagSuggestions } from "./AITagSuggestions";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface ConceptualTagsSectionProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  bookTitle?: string;
  bookAuthor?: string;
  bookDescription?: string;
  userTaggingPatterns?: string[];
  isEditMode?: boolean;
}

const ConceptualTagsSection = ({ 
  selectedTags, 
  onTagToggle,
  bookTitle,
  bookAuthor,
  bookDescription,
  userTaggingPatterns,
  isEditMode = false
}: ConceptualTagsSectionProps) => {
  const { selection } = useHapticFeedback();
  const canShowAISuggestions = bookTitle && bookAuthor && bookTitle.length > 2 && bookAuthor.length > 2;

  const handleTagToggle = (tag: string) => {
    selection();
    onTagToggle(tag);
  };

  return (
    <div>
      <Label className="text-slate-300 text-sm mb-3 block">Conceptual Nodes</Label>
      <div className="grid grid-cols-2 gap-2">
        {CONCEPTUAL_TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagToggle(tag)}
            className={`px-3 py-2 rounded-full text-xs transition-colors active:scale-95 ${
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
          onTagSelect={handleTagToggle}
          userTaggingPatterns={userTaggingPatterns}
          autoApply={!isEditMode && selectedTags.length === 0}
        />
      )}
    </div>
  );
};

export default ConceptualTagsSection;
