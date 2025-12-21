import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SearchFilters as SearchFiltersType } from '@/services/semanticSearchService';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  availableGenres?: string[];
  className?: string;
}

const SOURCE_TYPE_OPTIONS = [
  { value: 'transmission', label: 'My Library' },
  { value: 'author_book', label: 'Author Books' },
  { value: 'publisher_book', label: 'Publisher Books' },
  { value: 'google_books', label: 'Google Books' },
];

const GENRE_OPTIONS = [
  'Hard SF',
  'Space Opera',
  'Cyberpunk',
  'Post-Apocalyptic',
  'Military SF',
  'Time Travel',
  'First Contact',
  'Dystopian',
  'Biopunk',
  'Climate Fiction',
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  availableGenres = GENRE_OPTIONS,
  className,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const updateFilter = <K extends keyof SearchFiltersType>(
    key: K,
    value: SearchFiltersType[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleGenre = (genre: string) => {
    const currentGenres = filters.genres || [];
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    updateFilter('genres', newGenres.length > 0 ? newGenres : undefined);
  };

  const toggleSourceType = (sourceType: string) => {
    const current = filters.sourceTypes || [];
    const updated = current.includes(sourceType)
      ? current.filter(s => s !== sourceType)
      : [...current, sourceType];
    updateFilter('sourceTypes', updated.length > 0 ? updated : undefined);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = [
    filters.sourceTypes?.length || 0,
    filters.genres?.length || 0,
    filters.yearRange ? 1 : 0,
    filters.minRating ? 1 : 0,
    filters.excludeRead ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-200"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-blue-500/20 text-blue-300 border-blue-500/30">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-slate-500 hover:text-slate-300"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="space-y-6 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
          {/* Source types */}
          <div>
            <Label className="text-sm text-slate-300 mb-3 block">Search In</Label>
            <div className="flex flex-wrap gap-2">
              {SOURCE_TYPE_OPTIONS.map(({ value, label }) => (
                <Badge
                  key={value}
                  variant="outline"
                  onClick={() => toggleSourceType(value)}
                  className={cn(
                    'cursor-pointer transition-colors',
                    filters.sourceTypes?.includes(value)
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                      : 'bg-slate-700/30 text-slate-400 border-slate-600/50 hover:border-slate-500'
                  )}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Genres */}
          <div>
            <Label className="text-sm text-slate-300 mb-3 block">Genres</Label>
            <div className="flex flex-wrap gap-2">
              {availableGenres.map((genre) => (
                <Badge
                  key={genre}
                  variant="outline"
                  onClick={() => toggleGenre(genre)}
                  className={cn(
                    'cursor-pointer transition-colors',
                    filters.genres?.includes(genre)
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                      : 'bg-slate-700/30 text-slate-400 border-slate-600/50 hover:border-slate-500'
                  )}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          {/* Year range */}
          <div>
            <Label className="text-sm text-slate-300 mb-3 block">
              Publication Year
              {filters.yearRange && (
                <span className="text-slate-500 ml-2">
                  {filters.yearRange[0]} - {filters.yearRange[1]}
                </span>
              )}
            </Label>
            <Slider
              value={filters.yearRange || [1950, 2024]}
              onValueChange={(value) => updateFilter('yearRange', value as [number, number])}
              min={1900}
              max={2024}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1900</span>
              <span>2024</span>
            </div>
          </div>

          {/* Min rating */}
          <div>
            <Label className="text-sm text-slate-300 mb-3 block">
              Minimum Rating
              {filters.minRating && (
                <span className="text-slate-500 ml-2">{filters.minRating}+ stars</span>
              )}
            </Label>
            <Slider
              value={[filters.minRating || 0]}
              onValueChange={([value]) => updateFilter('minRating', value > 0 ? value : undefined)}
              min={0}
              max={5}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Any</span>
              <span>5 stars</span>
            </div>
          </div>

          {/* Exclude read books */}
          <div className="flex items-center justify-between">
            <Label htmlFor="exclude-read" className="text-sm text-slate-300">
              Exclude books I've read
            </Label>
            <Switch
              id="exclude-read"
              checked={filters.excludeRead || false}
              onCheckedChange={(checked) => updateFilter('excludeRead', checked || undefined)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
