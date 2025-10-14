import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { ReadingVelocity } from "@/services/patternRecognition";

interface ReadingVelocityIndicatorProps {
  velocity: ReadingVelocity;
  compact?: boolean;
}

export const ReadingVelocityIndicator = ({ velocity, compact = false }: ReadingVelocityIndicatorProps) => {
  const getTrendIcon = () => {
    switch (velocity.trend) {
      case 'accelerating':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'slowing':
        return <TrendingDown className="w-4 h-4 text-warning" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getMomentumColor = () => {
    if (velocity.momentum > 0.7) return 'text-success';
    if (velocity.momentum > 0.4) return 'text-primary';
    return 'text-muted-foreground';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Zap className={`w-3 h-3 ${getMomentumColor()}`} />
        <span className="text-muted-foreground">{velocity.booksPerMonth} books/mo</span>
        {getTrendIcon()}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-3">
        <Zap className={`w-5 h-5 ${getMomentumColor()}`} />
        <div>
          <div className="text-sm font-medium">Reading Velocity</div>
          <div className="text-xs text-muted-foreground">
            {velocity.booksPerMonth} books/month
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getTrendIcon()}
        <span className="text-xs text-muted-foreground capitalize">{velocity.trend}</span>
      </div>
    </div>
  );
};
