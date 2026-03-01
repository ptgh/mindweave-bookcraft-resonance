import { useState } from 'react';
import { ChevronDown, ChevronRight, Filter, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FilterSection {
  label: string;
  color: string;
  items: { id: string; label: string; count?: number }[];
}

interface ERFilterSidebarProps {
  authors: { id: string; name: string; bookCount: number }[];
  themes: { tag: string; count: number }[];
  selectedAuthors: Set<string>;
  selectedThemes: Set<string>;
  showAuthors: boolean;
  showProtagonists: boolean;
  onToggleAuthor: (id: string) => void;
  onToggleTheme: (tag: string) => void;
  onToggleShowAuthors: (v: boolean) => void;
  onToggleShowProtagonists: (v: boolean) => void;
  onClearAll: () => void;
  onClose?: () => void;
  isMobile?: boolean;
  hideHeader?: boolean;
}

const ERFilterSidebar = ({
  authors,
  themes,
  selectedAuthors,
  selectedThemes,
  showAuthors,
  showProtagonists,
  onToggleAuthor,
  onToggleTheme,
  onToggleShowAuthors,
  onToggleShowProtagonists,
  onClearAll,
  onClose,
  isMobile,
  hideHeader,
}: ERFilterSidebarProps) => {
  const [authorsOpen, setAuthorsOpen] = useState(true);
  const [themesOpen, setThemesOpen] = useState(true);

  const hasActiveFilters = selectedAuthors.size > 0 || selectedThemes.size > 0 || !showAuthors || !showProtagonists;

  return (
    <div className={`flex flex-col h-full ${isMobile ? '' : 'w-64'}`}>
      {/* Header - hidden when parent provides its own */}
      {!hideHeader && (
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 border-b border-cyan-400/10 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400/70" />
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Filter Key</span>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button onClick={onClearAll} className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-0.5 bg-cyan-400/10 rounded-full">
                Clear
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {/* Node type toggles */}
        <div className="space-y-2 mb-4">
          <h4 className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-1">Show</h4>
          <label className="flex items-center gap-2 px-1 py-1 cursor-pointer hover:bg-slate-800/30 rounded">
            <Checkbox checked={showAuthors} onCheckedChange={(v) => onToggleShowAuthors(!!v)} className="border-amber-400/50 data-[state=checked]:bg-amber-500/80 data-[state=checked]:border-amber-400" />
            <span className="text-xs text-amber-300/80">Authors</span>
          </label>
          <label className="flex items-center gap-2 px-1 py-1 cursor-pointer hover:bg-slate-800/30 rounded">
            <Checkbox checked={showProtagonists} onCheckedChange={(v) => onToggleShowProtagonists(!!v)} className="border-purple-400/50 data-[state=checked]:bg-purple-500/80 data-[state=checked]:border-purple-400" />
            <span className="text-xs text-purple-300/80">Protagonists</span>
          </label>
        </div>

        {/* Authors */}
        <Collapsible open={authorsOpen} onOpenChange={setAuthorsOpen} className="mb-3">
          <CollapsibleTrigger className="flex items-center gap-1.5 w-full px-1 py-1.5 hover:bg-slate-800/30 rounded transition-colors">
            {authorsOpen ? <ChevronDown className="w-3 h-3 text-amber-400/60" /> : <ChevronRight className="w-3 h-3 text-amber-400/60" />}
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Authors</span>
            <span className="text-[9px] text-slate-600 ml-auto">{authors.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-1">
            {authors.map(a => {
              const isSelected = selectedAuthors.size === 0 || selectedAuthors.has(a.id);
              return (
                <label
                  key={a.id}
                  className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-slate-800/30 rounded transition-colors"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleAuthor(a.id)}
                    className="border-amber-400/40 data-[state=checked]:bg-amber-500/60 data-[state=checked]:border-amber-400/60 h-3.5 w-3.5"
                  />
                  <span className={`text-xs truncate ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>{a.name}</span>
                  <span className="text-[9px] text-slate-600 ml-auto flex-shrink-0">{a.bookCount}</span>
                </label>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Themes */}
        <Collapsible open={themesOpen} onOpenChange={setThemesOpen} className="mb-3">
          <CollapsibleTrigger className="flex items-center gap-1.5 w-full px-1 py-1.5 hover:bg-slate-800/30 rounded transition-colors">
            {themesOpen ? <ChevronDown className="w-3 h-3 text-cyan-400/60" /> : <ChevronRight className="w-3 h-3 text-cyan-400/60" />}
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Themes</span>
            <span className="text-[9px] text-slate-600 ml-auto">{themes.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-1">
            {themes.map(t => {
              const isSelected = selectedThemes.size === 0 || selectedThemes.has(t.tag);
              return (
                <label
                  key={t.tag}
                  className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-slate-800/30 rounded transition-colors"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleTheme(t.tag)}
                    className="border-cyan-400/40 data-[state=checked]:bg-cyan-500/60 data-[state=checked]:border-cyan-400/60 h-3.5 w-3.5"
                  />
                  <span className={`text-xs truncate ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>{t.tag}</span>
                  <span className="text-[9px] text-slate-600 ml-auto flex-shrink-0">{t.count}</span>
                </label>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default ERFilterSidebar;
