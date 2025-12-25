import React, { useState, useEffect, useRef } from 'react';
import { User, BookOpen, MessageSquare, TrendingUp, Globe, Sparkles } from 'lucide-react';
import { useFeaturedContent } from '@/hooks/useFeaturedContent';
import EnhancedBookPreviewModal from '@/components/EnhancedBookPreviewModal';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

interface FeaturedSectionProps {
  className?: string;
}

export const FeaturedSection: React.FC<FeaturedSectionProps> = ({ className }) => {
  const { featuredContent, loading } = useFeaturedContent();
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const workRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Modal state for notable works
  const [selectedWork, setSelectedWork] = useState<{
    title: string;
    author: string;
  } | null>(null);

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

  // Add hover animation to notable works
  useEffect(() => {
    workRefs.current.filter(Boolean).forEach(ref => {
      if (!ref) return;
      
      const handleMouseEnter = () => {
        gsap.to(ref, { scale: 1.05, duration: 0.2, ease: 'power2.out' });
      };
      
      const handleMouseLeave = () => {
        gsap.to(ref, { scale: 1, duration: 0.2, ease: 'power2.out' });
      };
      
      ref.addEventListener('mouseenter', handleMouseEnter);
      ref.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        ref.removeEventListener('mouseenter', handleMouseEnter);
        ref.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, [featuredContent]);

  const handleWorkClick = (workTitle: string) => {
    if (!featuredContent?.featured_author?.name) return;
    
    setSelectedWork({
      title: workTitle,
      author: featuredContent.featured_author.name
    });
  };

  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-slate-800/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Generate author initials for avatar
  const authorInitials = featuredContent?.featured_author?.name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AU';

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
    <>
      <div ref={sectionRef} className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
        {/* Featured Author Card */}
        <div
          ref={el => { cardsRef.current[0] = el; }}
          className={cn(
            "rounded-xl border p-5 transition-all duration-300 hover:shadow-lg",
            colorClasses.blue.bg,
            colorClasses.blue.border,
            colorClasses.blue.glow
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("p-2 rounded-lg", colorClasses.blue.icon)}>
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-slate-400">Featured Author</h3>
          </div>
          
          {featuredContent?.featured_author ? (
            <div className="space-y-3">
              {/* Author Header with Avatar */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {authorInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium text-slate-200 truncate">
                    {featuredContent.featured_author.name}
                  </p>
                  {featuredContent.featured_author.nationality && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {featuredContent.featured_author.nationality}
                    </p>
                  )}
                </div>
              </div>

              {/* Notable Works - Now Clickable */}
              {featuredContent.featured_author.notable_works && 
               featuredContent.featured_author.notable_works.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Notable Works
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {featuredContent.featured_author.notable_works.slice(0, 3).map((work, i) => (
                      <button 
                        key={i}
                        ref={el => { workRefs.current[i] = el; }}
                        onClick={() => handleWorkClick(work)}
                        className="text-xs px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 truncate max-w-[120px] hover:bg-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer"
                        title={`Preview "${work}"`}
                      >
                        {work}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {featuredContent.featured_author.transmission_count} readers this month
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No featured author yet</p>
          )}
        </div>

        {/* Featured Book Card */}
        <div
          ref={el => { cardsRef.current[1] = el; }}
          className={cn(
            "rounded-xl border p-5 transition-all duration-300 hover:shadow-lg",
            colorClasses.purple.bg,
            colorClasses.purple.border,
            colorClasses.purple.glow
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("p-2 rounded-lg", colorClasses.purple.icon)}>
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-slate-400">Hot Book</h3>
          </div>
          
          {featuredContent?.featured_book ? (
            <div className="flex gap-3">
              {/* Book Cover */}
              {featuredContent.featured_book.cover_url ? (
                <img 
                  src={featuredContent.featured_book.cover_url}
                  alt={featuredContent.featured_book.title}
                  className="w-16 h-24 object-cover rounded-md shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-24 bg-slate-700 rounded-md flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-slate-500" />
                </div>
              )}
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-lg font-medium text-slate-200 line-clamp-2">
                  {featuredContent.featured_book.title}
                </p>
                <p className="text-sm text-slate-400 truncate">
                  by {featuredContent.featured_book.author}
                </p>
                <p className="text-xs text-purple-400 mt-1">
                  {featuredContent.featured_book.post_count} discussions
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Start a discussion!</p>
          )}
        </div>

        {/* Trending Post Card */}
        <div
          ref={el => { cardsRef.current[2] = el; }}
          className={cn(
            "rounded-xl border p-5 transition-all duration-300 hover:shadow-lg",
            colorClasses.emerald.bg,
            colorClasses.emerald.border,
            colorClasses.emerald.glow
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("p-2 rounded-lg", colorClasses.emerald.icon)}>
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-slate-400">Trending Post</h3>
          </div>
          
          {featuredContent?.featured_post ? (
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
          )}
        </div>
      </div>

      {/* Book Preview Modal for Notable Works */}
      {selectedWork && (
        <EnhancedBookPreviewModal
          book={{
            id: `notable-${selectedWork.title.replace(/\s+/g, '-').toLowerCase()}`,
            title: selectedWork.title,
            author: selectedWork.author,
            series_id: 'featured-author-works',
            created_at: new Date().toISOString()
          }}
          onClose={() => setSelectedWork(null)}
          onAddBook={() => {}}
        />
      )}
    </>
  );
};
