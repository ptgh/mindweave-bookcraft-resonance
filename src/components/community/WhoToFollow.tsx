import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFollowing } from '@/hooks/useFollowing';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

interface SuggestedUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  shared_authors: number;
  transmission_count: number;
}

interface WhoToFollowProps {
  className?: string;
}

export const WhoToFollow: React.FC<WhoToFollowProps> = ({ className }) => {
  const { user } = useAuth();
  const { following, followUser, isFollowing } = useFollowing();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) {
        setLoading(false);
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        // Get current user's authors from their transmissions
        const { data: userTransmissions, error: transError } = await supabase
          .from('transmissions')
          .select('author')
          .eq('user_id', user.id)
          .not('author', 'is', null);

        if (transError) {
          console.error('Error fetching user transmissions:', transError);
          setLoading(false);
          setSuggestions([]);
          return;
        }

        const userAuthors = new Set(
          (userTransmissions || [])
            .map(t => t.author?.toLowerCase().trim())
            .filter(Boolean)
        );

        // Get users who have similar authors (excluding current user and already following)
        const followingIds = following.map(f => f.id);
        
        // Build a simple query - just exclude current user first
        let query = supabase
          .from('transmissions')
          .select('user_id, author')
          .neq('user_id', user.id)
          .not('author', 'is', null)
          .limit(500);

        const { data: otherTransmissions, error: otherError } = await query;

        if (otherError) {
          console.error('Error fetching other transmissions:', otherError);
          setLoading(false);
          setSuggestions([]);
          return;
        }

        // Filter out already followed users in JS
        const excludeSet = new Set([user.id, ...followingIds]);

        // Calculate shared authors per user
        const userScores: Map<string, { shared: number; total: number }> = new Map();
        
        (otherTransmissions || []).forEach(t => {
          if (!t.user_id || !t.author || excludeSet.has(t.user_id)) return;
          
          const current = userScores.get(t.user_id) || { shared: 0, total: 0 };
          current.total++;
          
          if (userAuthors.has(t.author.toLowerCase().trim())) {
            current.shared++;
          }
          
          userScores.set(t.user_id, current);
        });

        // Sort by shared authors and get top suggestions
        const sortedUsers = Array.from(userScores.entries())
          .filter(([_, score]) => score.shared > 0 || score.total >= 3)
          .sort((a, b) => b[1].shared - a[1].shared || b[1].total - a[1].total)
          .slice(0, 5)
          .map(([userId]) => userId);

        if (sortedUsers.length === 0) {
          // Fallback: get users with most transmissions from the data we already have
          const userCounts: Map<string, number> = new Map();
          (otherTransmissions || []).forEach(t => {
            if (t.user_id && !excludeSet.has(t.user_id)) {
              userCounts.set(t.user_id, (userCounts.get(t.user_id) || 0) + 1);
            }
          });

          const topUsers = Array.from(userCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([userId]) => userId);

          if (topUsers.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, bio')
              .in('id', topUsers);

            setSuggestions(
              (profiles || []).map(p => ({
                ...p,
                shared_authors: 0,
                transmission_count: userCounts.get(p.id) || 0
              }))
            );
          } else {
            setSuggestions([]);
          }
        } else {
          // Get profiles for suggested users
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, bio')
            .in('id', sortedUsers);

          setSuggestions(
            (profiles || []).map(p => ({
              ...p,
              shared_authors: userScores.get(p.id)?.shared || 0,
              transmission_count: userScores.get(p.id)?.total || 0
            })).sort((a, b) => b.shared_authors - a.shared_authors)
          );
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [user, following]);

  // Animate cards on load
  useEffect(() => {
    if (!loading && suggestions.length > 0) {
      gsap.fromTo(
        cardRefs.current.filter(Boolean),
        { opacity: 0, x: -10 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.3, 
          stagger: 0.08, 
          ease: 'power2.out' 
        }
      );
    }
  }, [loading, suggestions]);

  const handleFollow = async (userId: string) => {
    setFollowingIds(prev => new Set(prev).add(userId));
    const success = await followUser(userId);
    if (!success) {
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  if (!user) {
    return (
      <div className={cn("p-5 rounded-xl bg-slate-800/30 border border-slate-700/50", className)}>
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-400" />
          Who to Follow
        </h3>
        <p className="text-xs text-slate-500">Sign in to see personalized suggestions.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("p-5 rounded-xl bg-slate-800/30 border border-slate-700/50", className)}>
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-400" />
          Who to Follow
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700/50 animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-2 w-16 bg-slate-700/30 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className={cn("p-5 rounded-xl bg-slate-800/30 border border-slate-700/50", className)}>
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-400" />
          Who to Follow
        </h3>
        <p className="text-xs text-slate-500">No suggestions yet. Add more books to get personalized recommendations!</p>
      </div>
    );
  }

  return (
    <div className={cn("p-5 rounded-xl bg-slate-800/30 border border-slate-700/50", className)}>
      <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-blue-400" />
        Who to Follow
      </h3>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const alreadyFollowing = isFollowing(suggestion.id) || followingIds.has(suggestion.id);
          
          return (
            <div
              key={suggestion.id}
              ref={el => { cardRefs.current[index] = el; }}
              className="flex items-center gap-3"
            >
              <Avatar className="h-10 w-10 border border-slate-700">
                <AvatarImage src={suggestion.avatar_url || undefined} />
                <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                  {(suggestion.display_name || 'R').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {suggestion.display_name || 'Reader'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {suggestion.shared_authors > 0 
                    ? `${suggestion.shared_authors} shared author${suggestion.shared_authors > 1 ? 's' : ''}`
                    : `${suggestion.transmission_count} books`}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleFollow(suggestion.id)}
                disabled={alreadyFollowing}
                className={cn(
                  "h-7 px-2 text-xs",
                  alreadyFollowing 
                    ? "text-slate-500" 
                    : "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                )}
              >
                {alreadyFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
