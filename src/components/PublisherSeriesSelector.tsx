
import { PublisherSeries } from "@/services/publisherService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PublisherSeriesSelectorProps {
  series: PublisherSeries[];
  selectedSeriesId?: string;
  onSeriesChange: (seriesId: string) => void;
}

const PublisherSeriesSelector = ({ series, selectedSeriesId, onSeriesChange }: PublisherSeriesSelectorProps) => {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-light text-slate-200 mb-2">Select Publisher Series</h2>
        <p className="text-slate-400 text-sm">
          Explore publisher-curated classics and modern masterworks. Switch between series to discover new speculative frontiers.
        </p>
      </div>
      
      <Select value={selectedSeriesId} onValueChange={onSeriesChange}>
        <SelectTrigger className="w-full max-w-md bg-slate-800/50 border-slate-600 text-slate-200">
          <SelectValue placeholder="Choose a publisher series..." />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-600">
          {series.map((s) => (
            <SelectItem key={s.id} value={s.id} className="text-slate-200 focus:bg-slate-700">
              <div className="flex items-center space-x-2">
                <span>{s.badge_emoji}</span>
                <span>{s.name}</span>
                <span className="text-slate-400 text-xs">({s.publisher})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PublisherSeriesSelector;
