import React from 'react';
import { Dna, Sparkles } from 'lucide-react';
import { ReadingDNA } from '@/services/patternRecognition';

interface ReadingDNAProfileProps {
  dna: ReadingDNA;
}

const ReadingDNAProfile: React.FC<ReadingDNAProfileProps> = ({ dna }) => {
  const getTemporalIcon = (pref: string) => {
    switch (pref) {
      case 'classic': return '📜';
      case 'modern': return '📚';
      case 'contemporary': return '✨';
      default: return '🔀';
    }
  };

  return (
    <div className="p-6 rounded-lg border border-purple-500/30 bg-purple-500/10">
      <div className="flex items-center space-x-2 mb-6">
        <Dna className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-medium text-slate-200">Your Reading DNA</h3>
      </div>

      {/* Signature */}
      <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-purple-500/20">
        <div className="text-xs text-purple-400 mb-1">DNA Signature</div>
        <div className="text-sm font-mono text-slate-200 break-all">{dna.signature}</div>
      </div>

      {/* Genre Profile */}
      <div className="mb-6">
        <div className="text-sm font-medium text-slate-300 mb-3">Genre Distribution</div>
        <div className="space-y-2">
          {dna.genreProfile.map((genre, index) => (
            <div key={genre.genre} className="flex items-center space-x-2">
              <div className="w-20 text-xs text-slate-400 truncate">{genre.genre}</div>
              <div className="flex-1 h-6 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full flex items-center px-2 text-xs font-medium text-white transition-all"
                  style={{
                    width: `${Math.max(genre.percentage, 10)}%`,
                    background: `linear-gradient(90deg, 
                      hsl(${260 + index * 30}, 70%, 55%),
                      hsl(${260 + index * 30}, 60%, 45%)
                    )`
                  }}
                >
                  {genre.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Temporal Preference */}
      <div className="mb-6 flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getTemporalIcon(dna.temporalPreference)}</span>
          <div>
            <div className="text-xs text-slate-500">Temporal Preference</div>
            <div className="text-sm text-slate-200 capitalize">{dna.temporalPreference}</div>
          </div>
        </div>
      </div>

      {/* Behavioral Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-slate-900/30 rounded-lg">
          <div className="text-2xl font-bold text-purple-400">
            {(dna.diversityScore * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Diversity</div>
        </div>

        <div className="text-center p-3 bg-slate-900/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">
            {(dna.explorationScore * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Explorer</div>
        </div>

        <div className="text-center p-3 bg-slate-900/30 rounded-lg">
          <div className="text-2xl font-bold text-green-400">
            {(dna.consistencyScore * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Focused</div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
        <div className="flex items-start space-x-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">Your Profile: </span>
            {dna.explorationScore > 0.6 ? (
              "You're an adventurous explorer, constantly seeking new literary territories!"
            ) : dna.consistencyScore > 0.6 ? (
              "You're a focused reader with strong preferences and deep genre knowledge."
            ) : (
              "You balance exploration and consistency, building a diverse yet curated library."
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingDNAProfile;
