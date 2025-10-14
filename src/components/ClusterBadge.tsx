import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link2 } from 'lucide-react';

interface ClusterBadgeProps {
  theme: string;
  bookCount: number;
}

export const ClusterBadge = ({ theme, bookCount }: ClusterBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="text-xs gap-1 bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <Link2 className="h-3 w-3" />
            {theme}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Part of {bookCount}-book cluster exploring "{theme}"</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
