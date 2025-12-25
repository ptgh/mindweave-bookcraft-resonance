import React, { useEffect, useRef } from 'react';
import { User, BookOpen, MessageSquare, TrendingUp } from 'lucide-react';
import { useFeaturedContent } from '@/hooks/useFeaturedContent';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

interface FeaturedSectionProps {
  className?: string;
}

export const FeaturedSection: React.FC<FeaturedSectionProps> = ({ className }) => {
  const { featuredContent, loading } = useFeaturedContent();
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current || loading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardsRef.current.filter(Boolean),
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power3.out'
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [loading]);

  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-slate-800/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Featured Author',
      icon: User,
      color: 'blue',
      content: featuredContent?.featured_author ? (
        <>
          <p className="text-lg font-medium text-slate-200 truncate">
            {featuredContent.featured_author.name}
          </p>
          <p className="text-sm text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {featuredContent.featured_author.transmission_count} readers this month
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-500">No featured author yet</p>
      )
    },
    {
      title: 'Hot Discussion',
      icon: BookOpen,
      color: 'purple',
      content: featuredContent?.featured_book ? (
        <>
          <p className="text-lg font-medium text-slate-200 truncate">
            {featuredContent.featured_book.title}
          </p>
          <p className="text-sm text-slate-400">
            by {featuredContent.featured_book.author}
          </p>
          <p className="text-xs text-purple-400 mt-1">
            {featuredContent.featured_book.post_count} discussions
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-500">Start a discussion!</p>
      )
    },
    {
      title: 'Trending Post',
      icon: MessageSquare,
      color: 'emerald',
      content: featuredContent?.featured_post ? (
        <>
          <p className="text-sm text-slate-300 line-clamp-2">
            "{featuredContent.featured_post.content}..."
          </p>
          <p className="text-xs text-slate-500 mt-2">
            on {featuredContent.featured_post.book_title}
          </p>
          <p className="text-xs text-emerald-400">
            {featuredContent.featured_post.likes_count} likes
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-500">Be the first to post!</p>
      )
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      icon: 'bg-blue-500/20 text-blue-400',
      glow: 'hover:shadow-blue-500/10'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20 hover:border-purple-500/40',
      icon: 'bg-purple-500/20 text-purple-400',
      glow: 'hover:shadow-purple-500/10'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      icon: 'bg-emerald-500/20 text-emerald-400',
      glow: 'hover:shadow-emerald-500/10'
    }
  };

  return (
    <div ref={sectionRef} className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {cards.map((card, index) => {
        const colors = colorClasses[card.color as keyof typeof colorClasses];
        return (
          <div
            key={card.title}
            ref={el => { cardsRef.current[index] = el; }}
            className={cn(
              "rounded-xl border p-5 transition-all duration-300 hover:shadow-lg",
              colors.bg,
              colors.border,
              colors.glow
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2 rounded-lg", colors.icon)}>
                <card.icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-medium text-slate-400">{card.title}</h3>
            </div>
            {card.content}
          </div>
        );
      })}
    </div>
  );
};
