import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HistoricalContextService } from '@/services/historicalContext';

interface HistoricalBadgeProps {
  year: number;
}

export const HistoricalBadge = ({ year }: HistoricalBadgeProps) => {
  const movement = HistoricalContextService.getLiteraryMovement(year);
  const zeitgeist = HistoricalContextService.getDecadeZeitgeist(year);
  
  if (!movement) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="text-xs bg-secondary/5 border-secondary/20 hover:bg-secondary/10 transition-colors"
          >
            {zeitgeist?.emoji} {HistoricalContextService.getMovementBadge(year)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold mb-1">{movement.name}</p>
          <p className="text-xs text-muted-foreground mb-2">{movement.description}</p>
          {zeitgeist && (
            <div className="text-xs space-y-1">
              <p><span className="font-medium">Cultural:</span> {zeitgeist.culturalThemes.slice(0, 2).join(', ')}</p>
              <p><span className="font-medium">Tech:</span> {zeitgeist.technologicalContext.slice(0, 2).join(', ')}</p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
