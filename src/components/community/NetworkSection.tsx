import React, { useEffect, useRef } from 'react';
import { Users, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFollowing } from '@/hooks/useFollowing';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { Link } from 'react-router-dom';

interface NetworkSectionProps {
  className?: string;
}

export const NetworkSection: React.FC<NetworkSectionProps> = ({ className }) => {
  const { following, loading } = useFollowing();
  const sectionRef = useRef<HTMLDivElement>(null);
  const avatarsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current || loading || following.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        avatarsRef.current.filter(Boolean),
        { opacity: 0, scale: 0.8, x: -10 },
        {
          opacity: 1,
          scale: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: 'back.out(1.5)'
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [loading, following]);

  if (loading) {
    return (
      <div className={cn("p-5 rounded-xl bg-slate-800/30 border border-slate-700/50", className)}>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-32 bg-slate-700/50 rounded animate-pulse" />
        </div>
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-12 h-12 rounded-full bg-slate-700/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className={cn("p-5 rounded-xl bg-slate-800/30 border border-slate-700/50", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-medium text-slate-300">Your Network</h3>
        </div>
        <p className="text-sm text-slate-500">
          You're not following anyone yet. Discover readers in the community!
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={sectionRef}
      className={cn("p-5 rounded-xl bg-slate-800/30 border border-slate-700/50", className)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-medium text-slate-300">Following</h3>
          <span className="text-xs text-slate-500">({following.length})</span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        {following.slice(0, 10).map((user, index) => (
          <div
            key={user.id}
            ref={el => { avatarsRef.current[index] = el; }}
            className="flex flex-col items-center gap-1 group cursor-pointer flex-shrink-0"
            title={user.display_name || 'Reader'}
          >
            <Avatar className="h-12 w-12 border-2 border-slate-700 group-hover:border-emerald-500/50 transition-colors">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-slate-700 text-slate-300">
                {(user.display_name || 'R').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-slate-500 truncate max-w-[60px] group-hover:text-slate-300 transition-colors">
              {user.display_name?.split(' ')[0] || 'Reader'}
            </span>
          </div>
        ))}
        
        {following.length > 10 && (
          <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 hover:bg-slate-700 transition-colors cursor-pointer">
              <span className="text-xs font-medium">+{following.length - 10}</span>
            </div>
            <span className="text-xs text-slate-500">more</span>
          </div>
        )}
      </div>
    </div>
  );
};
