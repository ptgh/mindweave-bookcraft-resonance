import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, MessageCircle, Star, Quote, ThumbsUp } from 'lucide-react';
import Header from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookPostCard, BookPostForm, FeaturedSection, CommunityStats, NetworkSection, WhoToFollow } from '@/components/community';
import { useBookPosts } from '@/hooks/useBookPosts';
import { useAuth } from '@/hooks/useAuth';
import gsap from 'gsap';

const Community: React.FC = () => {
  const { user } = useAuth();
  const { posts, loading, fetchPosts, deletePost } = useBookPosts();
  const [showPostForm, setShowPostForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'following'>('all');
  
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPosts({ filterFollowing: filter === 'following' });
  }, [fetchPosts, filter]);

  useEffect(() => {
    if (!heroRef.current || !contentRef.current) return;

    const ctx = gsap.context(() => {
      // Hero animation
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      // Content stagger animation
      gsap.fromTo(
        contentRef.current?.children || [],
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.1, 
          ease: 'power2.out',
          delay: 0.3
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const handleDeletePost = async (postId: string) => {
    await deletePost(postId);
    fetchPosts({ filterFollowing: filter === 'following' });
  };

  return (
    <>
      <SEOHead 
        title="Community - Leafnode"
        description="Connect with fellow readers, share your thoughts on books, and discover new perspectives in the Leafnode community."
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main id="main-content" className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* Hero Section */}
          <div ref={heroRef} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">Community Hub</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-light text-slate-200 mb-3">
              Connect • Discuss • <span className="text-emerald-400">Discover</span>
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              Share your reading journey, discover what others are exploring, and connect with fellow readers.
            </p>
          </div>

          {/* Stats Bar */}
          <CommunityStats className="mb-8" />

          <div ref={contentRef} className="space-y-8">
            {/* Featured Section */}
            <FeaturedSection />

            {/* Your Network */}
            <NetworkSection />

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Posts Feed */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'following')}>
                    <TabsList className="bg-slate-800/50">
                      <TabsTrigger value="all" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        All Posts
                      </TabsTrigger>
                      <TabsTrigger value="following" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        Following
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {user && (
                    <Button
                      onClick={() => setShowPostForm(true)}
                      className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Post
                    </Button>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-48 bg-slate-800/30 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No posts yet</h3>
                    <p className="text-slate-500 mb-4">
                      {filter === 'following' 
                        ? "People you follow haven't posted yet."
                        : "Be the first to share your thoughts!"}
                    </p>
                    {user && (
                      <Button
                        onClick={() => setShowPostForm(true)}
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-400"
                      >
                        Create First Post
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <BookPostCard
                        key={post.id}
                        post={post}
                        onDelete={() => handleDeletePost(post.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Who to Follow */}
                <WhoToFollow />

                <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">About Community</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Share discussions, reviews, quotes, and recommendations with fellow readers. 
                    Follow others to see their posts in your feed.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                  <h3 className="text-sm font-medium text-emerald-400 mb-3">Post Types</h3>
                  <ul className="text-xs text-slate-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span><strong className="text-slate-300">Discussion</strong> - Start a conversation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-slate-500" />
                      <span><strong className="text-slate-300">Review</strong> - Share your verdict</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Quote className="w-3.5 h-3.5 text-slate-500" />
                      <span><strong className="text-slate-300">Quote</strong> - Highlight a passage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
                      <span><strong className="text-slate-300">Recommendation</strong> - Suggest to others</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>

        <BookPostForm
          isOpen={showPostForm}
          onClose={() => setShowPostForm(false)}
          onSuccess={() => fetchPosts({ filterFollowing: filter === 'following' })}
        />
      </div>
    </>
  );
};

export default Community;
