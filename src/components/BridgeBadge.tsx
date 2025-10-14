import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Waypoints } from 'lucide-react';

interface BridgeBadgeProps {
  bridgeCount: number;
  topConcept?: string;
}

export const BridgeBadge = ({ bridgeCount, topConcept }: BridgeBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="text-xs gap-1 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors"
          >
            <Waypoints className="h-3 w-3" />
            {bridgeCount} {bridgeCount === 1 ? 'bridge' : 'bridges'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            Connects to {bridgeCount} other {bridgeCount === 1 ? 'book' : 'books'}
            {topConcept && ` via "${topConcept}"`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
