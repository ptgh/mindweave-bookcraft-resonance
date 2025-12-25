import React, { useEffect, useRef } from 'react';
import { Users, MessageSquare, Zap } from 'lucide-react';
import { useFeaturedContent } from '@/hooks/useFeaturedContent';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

interface CommunityStatsProps {
  className?: string;
}

export const CommunityStats: React.FC<CommunityStatsProps> = ({ className }) => {
  const { communityStats, loading } = useFeaturedContent();
  const statsRef = useRef<HTMLDivElement>(null);
  const countRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!statsRef.current || loading || !communityStats) return;

    const ctx = gsap.context(() => {
      // Animate the stats container
      gsap.fromTo(
        statsRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );

      // Animate count numbers
      const targets = [
        { ref: countRefs.current[0], value: communityStats.total_members },
        { ref: countRefs.current[1], value: communityStats.posts_today },
        { ref: countRefs.current[2], value: communityStats.active_discussions }
      ];

      targets.forEach(({ ref, value }) => {
        if (ref && value > 0) {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: value,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: function() {
              if (ref) ref.textContent = Math.round(obj.val).toString();
            }
          );
        }
      });
    }, statsRef);

    return () => ctx.revert();
  }, [loading, communityStats]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center gap-8 py-4", className)}>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-6 w-24 bg-slate-800/30 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      icon: Users,
      value: communityStats?.total_members || 0,
      label: 'Readers',
      color: 'text-blue-400'
    },
    {
      icon: MessageSquare,
      value: communityStats?.posts_today || 0,
      label: 'Posts Today',
      color: 'text-emerald-400'
    },
    {
      icon: Zap,
      value: communityStats?.active_discussions || 0,
      label: 'Active Discussions',
      color: 'text-purple-400'
    }
  ];

  return (
    <div 
      ref={statsRef}
      className={cn(
        "flex flex-wrap items-center justify-center gap-6 md:gap-10 py-4 px-6 rounded-xl bg-slate-800/30 border border-slate-700/50",
        className
      )}
    >
      {stats.map((stat, index) => (
        <div key={stat.label} className="flex items-center gap-2">
          <stat.icon className={cn("w-4 h-4", stat.color)} />
          <span 
            ref={el => { countRefs.current[index] = el; }}
            className={cn("text-lg font-semibold", stat.color)}
          >
            {stat.value}
          </span>
          <span className="text-sm text-slate-400">{stat.label}</span>
        </div>
      ))}
    </div>
  );
};
