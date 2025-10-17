import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CONCEPTUAL_TAGS } from "@/constants/conceptualTags";
import { Tag } from "lucide-react";

interface AuthorBookTagSelectorProps {
  bookTitle: string;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onLogSignal: () => void;
}

const AuthorBookTagSelector = ({
  bookTitle,
  selectedTags,
  onTagsChange,
  onLogSignal,
}: AuthorBookTagSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleLogSignal = () => {
    setIsOpen(false);
    onLogSignal();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-slate-300"
        >
          <Tag className="w-4 h-4 mr-1" />
          Tag & Log
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[480px] bg-slate-900 border-slate-700 p-4">
        <div className="space-y-3">
          <div>
            <h4 className="text-slate-200 font-medium text-sm mb-1">Select Conceptual Tags</h4>
            <p className="text-slate-400 text-xs mb-3">
              Choose tags for "{bookTitle.length > 40 ? bookTitle.substring(0, 40) + "..." : bookTitle}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto">
            {CONCEPTUAL_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-2 rounded-full text-xs transition-colors text-left ${
                  selectedTags.includes(tag)
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <span className="text-xs text-slate-400">
              {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""} selected
            </span>
            <Button
              onClick={handleLogSignal}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Log Signal
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AuthorBookTagSelector;
