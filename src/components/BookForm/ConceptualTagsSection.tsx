
import { Label } from "@/components/ui/label";
import { CONCEPTUAL_TAGS } from "@/constants/conceptualTags";

interface ConceptualTagsSectionProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

const ConceptualTagsSection = ({ selectedTags, onTagToggle }: ConceptualTagsSectionProps) => {
  return (
    <div>
      <Label className="text-slate-300 text-sm mb-3 block">Conceptual Tags</Label>
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
    </div>
  );
};

export default ConceptualTagsSection;
