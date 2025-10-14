import { Sparkles, TrendingUp, Minus, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThematicConstellation } from "@/services/patternRecognition";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ThematicConstellationBadgeProps {
  constellation: ThematicConstellation;
  showSatellites?: boolean;
}

export const ThematicConstellationBadge = ({ 
  constellation, 
  showSatellites = false 
}: ThematicConstellationBadgeProps) => {
  const getEvolutionIcon = () => {
    switch (constellation.evolution) {
      case 'emerging':
        return <TrendingUp className="w-3 h-3" />;
      case 'declining':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getVariant = () => {
    if (constellation.intensity > 0.7) return 'default';
    if (constellation.intensity > 0.4) return 'secondary';
    return 'outline';
  };

  const content = (
    <Badge variant={getVariant()} className="flex items-center gap-1.5">
      <Sparkles className="w-3 h-3" />
      {constellation.centralTheme}
      {getEvolutionIcon()}
    </Badge>
  );

  if (showSatellites && constellation.satellites.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-medium mb-1">Connected themes:</div>
              <div className="text-muted-foreground">
                {constellation.satellites.join(', ')}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};
