import React from 'react';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { ReadingVelocity } from '@/services/patternRecognition';

interface ReadingVelocityCardProps {
  velocity: ReadingVelocity;
}

const ReadingVelocityCard: React.FC<ReadingVelocityCardProps> = ({ velocity }) => {
  const getTrendIcon = () => {
    switch (velocity.trend) {
      case 'accelerating':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'decelerating':
        return <TrendingDown className="w-5 h-5 text-amber-400" />;
      default:
        return <Minus className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTrendColor = () => {
    switch (velocity.trend) {
      case 'accelerating':
        return 'border-green-500/30 bg-green-500/10';
      case 'decelerating':
        return 'border-amber-500/30 bg-amber-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  return (
    <div className={`p-6 rounded-lg border ${getTrendColor()} transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-medium text-slate-200">Reading Velocity</h3>
        </div>
        {getTrendIcon()}
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-3xl font-bold text-slate-200 mb-1">
            {velocity.booksPerMonth}
            <span className="text-sm font-normal text-slate-400 ml-2">books/month</span>
          </div>
          <div className="text-sm text-slate-400 capitalize">
            Trend: {velocity.trend}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700/50 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Avg. time between books</span>
            <span className="text-slate-200 font-medium">
              {velocity.averageTimeBetweenBooks.toFixed(0)} days
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Momentum</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                  style={{ width: `${velocity.momentum * 100}%` }}
                />
              </div>
              <span className="text-slate-200 font-medium w-12 text-right">
                {(velocity.momentum * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 text-xs text-slate-500">
          {velocity.momentum > 0.7 ? '🔥 High momentum - You\'re on a reading streak!' :
           velocity.momentum > 0.4 ? '📚 Steady pace - Keep it up!' :
           '💭 Slow period - Time to pick up a new book?'}
        </div>
      </div>
    </div>
  );
};

export default ReadingVelocityCard;
