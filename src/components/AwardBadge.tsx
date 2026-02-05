import React from 'react';
import { Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  getBookAwards, 
  getPrimaryAward, 
  AWARD_CONFIG, 
  SFAward, 
  AwardType 
} from '@/constants/sfAwards';

interface AwardBadgeProps {
  title: string;
  author?: string;
  size?: 'sm' | 'md';
  showAll?: boolean;
  className?: string;
}

/**
 * Displays award badges for books that have won Hugo, Nebula, or PKD awards
 */
export const AwardBadge: React.FC<AwardBadgeProps> = ({ 
  title, 
  author, 
  size = 'sm', 
  showAll = false,
  className = '' 
}) => {
  const awards = getBookAwards(title, author);
  
  if (awards.length === 0) return null;
  
  const displayAwards = showAll ? awards : [getPrimaryAward(title, author)!];
  const uniqueTypes = [...new Set(displayAwards.map(a => a.type))];
  
  if (size === 'sm') {
    // Compact single-line badge for card views
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center gap-1 ${className}`}>
              {uniqueTypes.slice(0, 2).map(type => (
                <span 
                  key={type}
                  className={`text-xs ${AWARD_CONFIG[type].color}`}
                  aria-label={AWARD_CONFIG[type].name}
                >
                  {AWARD_CONFIG[type].emoji}
                </span>
              ))}
              {awards.some(a => a.isWinner) && (
                <Award className="w-3 h-3 text-amber-400" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              {displayAwards.map((award, idx) => (
                <div key={idx} className="text-xs">
                  <span className={AWARD_CONFIG[award.type].color}>
                    {AWARD_CONFIG[award.type].emoji} {AWARD_CONFIG[award.type].name}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {award.isWinner ? 'Winner' : 'Nominee'} ({award.year})
                  </span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Medium size - multiple badges with labels
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {displayAwards.map((award, idx) => (
        <Badge
          key={idx}
          variant="outline"
          className={`text-xs ${AWARD_CONFIG[award.type].bgColor}`}
        >
          <span className="mr-1">{AWARD_CONFIG[award.type].emoji}</span>
          {award.isWinner ? 'Winner' : 'Nominee'} {award.year}
        </Badge>
      ))}
    </div>
  );
};

/**
 * Minimal award indicator for very compact spaces (just emoji)
 */
export const AwardIndicator: React.FC<{ title: string; author?: string; className?: string }> = ({ 
  title, 
  author,
  className = '' 
}) => {
  const primaryAward = getPrimaryAward(title, author);
  
  if (!primaryAward) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={`cursor-help ${AWARD_CONFIG[primaryAward.type].color} ${className}`}
            aria-label={`${AWARD_CONFIG[primaryAward.type].name} ${primaryAward.isWinner ? 'Winner' : 'Nominee'}`}
          >
            {AWARD_CONFIG[primaryAward.type].emoji}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {AWARD_CONFIG[primaryAward.type].name} {primaryAward.isWinner ? 'Winner' : 'Nominee'} ({primaryAward.year})
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AwardBadge;
