import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "sonner";
import { Target, Zap, Calendar, CheckCircle2 } from "lucide-react";

interface ReadingChallenge {
  id: string;
  challenge_type: string;
  title: string;
  description: string;
  goal_count: number;
  current_progress: number;
  status: string;
  difficulty: string;
  target_books: string[] | null;
  ai_encouragement: string;
  created_at: string;
  expires_at: string | null;
  metadata: any;
}

interface ReadingChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadingChallengeModal = ({ isOpen, onClose }: ReadingChallengeModalProps) => {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<ReadingChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (isOpen && user && !challenge) {
      loadChallenge();
    }
  }, [isOpen, user]);

  const loadChallenge = async (forceRegenerate = false) => {
    if (forceRegenerate) {
      setIsRegenerating(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-challenge-generator', {
        body: { forceRegenerate }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.message || data.error);
        return;
      }

      if (data.challenges && data.challenges.length > 0) {
        setChallenge(data.challenges[0]);
      }
    } catch (error) {
      console.error('Error loading challenge:', error);
      toast.error('Failed to load reading challenge');
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  const handleRegenerate = () => {
    loadChallenge(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'cluster_completion': return Target;
      case 'author_dive': return Target;
      case 'velocity': return Zap;
      default: return Target;
    }
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-900/95 border-slate-700/50 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-200">
              Reading Challenges
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">Sign in to access personalized reading challenges</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-900/95 border-slate-700/50 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-slate-200 flex items-center gap-3">
            <Target className="w-6 h-6 text-cyan-400" />
            Reading Challenge
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : challenge ? (
          <div className="space-y-6">
            {/* Challenge Header */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = getChallengeIcon(challenge.challenge_type);
                    return <Icon className="w-8 h-8 text-cyan-400" />;
                  })()}
                  <div>
                    <h3 className="text-xl font-medium text-slate-200">{challenge.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs uppercase tracking-wider ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </span>
                      {challenge.expires_at && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Until {new Date(challenge.expires_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  variant="outline"
                  size="sm"
                  className="border-slate-600/50 hover:border-cyan-500/50 hover:bg-slate-800/50"
                >
                  {isRegenerating ? 'Generating...' : 'New Challenge'}
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-slate-300">
                    {challenge.current_progress} / {challenge.goal_count} books
                  </span>
                </div>
                <div className="w-full bg-slate-700/30 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(challenge.current_progress / challenge.goal_count) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-800/20 border border-slate-700/20 rounded-lg p-5">
              <p className="text-slate-300 leading-relaxed">{challenge.description}</p>
            </div>

            {/* AI Encouragement */}
            {challenge.ai_encouragement && (
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
                <p className="text-cyan-200/90 text-sm italic leading-relaxed">
                  "{challenge.ai_encouragement}"
                </p>
              </div>
            )}

            {/* Target Books */}
            {challenge.target_books && challenge.target_books.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Suggested Reads
                </h4>
                <div className="space-y-2">
                  {challenge.target_books.map((book, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-slate-800/20 border border-slate-700/30 rounded p-3 hover:border-cyan-500/30 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-300 text-sm">{book}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            {challenge.metadata?.milestones && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Milestones
                </h4>
                <div className="space-y-2">
                  {challenge.metadata.milestones.map((milestone: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 text-sm text-slate-400"
                    >
                      <span className="text-blue-400 font-medium">{index + 1}.</span>
                      <span>{milestone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated timestamp */}
            <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-700/30">
              Challenge generated {new Date(challenge.created_at).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No active challenge yet</p>
            <Button
              onClick={() => loadChallenge(true)}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-200"
            >
              Generate Challenge
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};