import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, UserPlus, UserMinus, Users, Compass, ArrowLeft, BookOpen, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFollowing, UserProfile, FollowedTransmission } from '@/hooks/useFollowing';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import gsap from 'gsap';
import EnhancedBookPreviewModal from '@/components/EnhancedBookPreviewModal';
import type { EnrichedPublisherBook } from '@/services/publisherService';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserWithStats extends UserProfile {
  transmission_count?: number;
  follower_count?: number;
}

export const CommunityModal = ({ isOpen, onClose }: CommunityModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { 
    following, 
    followers, 
    loading, 
    followUser, 
    unfollowUser, 
    isFollowing, 
    searchUsers,
    getFollowedTransmissions 
  } = useFollowing();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followedTransmissions, setFollowedTransmissions] = useState<FollowedTransmission[]>([]);
  const [loadingTransmissions, setLoadingTransmissions] = useState(false);
  
  // Discover state
  const [discoverUsers, setDiscoverUsers] = useState<UserWithStats[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  
  // User profile view state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserTransmissions, setSelectedUserTransmissions] = useState<FollowedTransmission[]>([]);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  
  // Book preview state
  const [previewBook, setPreviewBook] = useState<EnrichedPublisherBook | null>(null);
  
  // Scroll container ref for horizontal scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(modalRef.current, 
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    const loadTransmissions = async () => {
      if (following.length > 0) {
        setLoadingTransmissions(true);
        const transmissions = await getFollowedTransmissions();
        setFollowedTransmissions(transmissions);
        setLoadingTransmissions(false);
      }
    };
    loadTransmissions();
  }, [following, getFollowedTransmissions]);

  // Load discover users (random active readers)
  const loadDiscoverUsers = useCallback(async () => {
    setLoadingDiscover(true);
    try {
      // Get profiles with display names, excluding current user and already following
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const followingIds = following.map(f => f.id);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio')
        .not('id', 'eq', user.id)
        .not('display_name', 'is', null)
        .limit(20);

      if (error) throw error;

      // Filter out already following and shuffle
      const filtered = (profiles || [])
        .filter(p => !followingIds.includes(p.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);

      if (filtered.length === 0) {
        setDiscoverUsers([]);
        return;
      }

      // Use secure RPC to get stats for all users at once
      const userIds = filtered.map(p => p.id);
      const { data: stats, error: statsError } = await supabase
        .rpc('get_user_stats', { user_ids: userIds });

      if (statsError) {
        console.error('Error fetching user stats:', statsError);
        // Fallback to profiles without stats
        setDiscoverUsers(filtered.map(p => ({ ...p, transmission_count: 0, follower_count: 0 })));
        return;
      }

      // Merge stats with profiles
      const usersWithStats = filtered.map(p => {
        const userStats = (stats || []).find((s: any) => s.user_id === p.id);
        return {
          ...p,
          transmission_count: userStats?.transmission_count || 0,
          follower_count: userStats?.follower_count || 0
        } as UserWithStats;
      });

      // Sort by transmission count (most active first)
      usersWithStats.sort((a, b) => (b.transmission_count || 0) - (a.transmission_count || 0));
      
      setDiscoverUsers(usersWithStats);
    } catch (error) {
      console.error('Error loading discover users:', error);
    } finally {
      setLoadingDiscover(false);
    }
  }, [following]);

  // Load user's full transmission collection
  const loadUserTransmissions = useCallback(async (userId: string) => {
    setLoadingUserProfile(true);
    try {
      const { data, error } = await supabase
        .from('transmissions')
        .select('id, title, author, cover_url, created_at, user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const userProfile = following.find(f => f.id === userId) || 
                          discoverUsers.find(u => u.id === userId) ||
                          searchResults.find(u => u.id === userId);
      
      setSelectedUserTransmissions((data || []).map(t => ({
        ...t,
        user_display_name: userProfile?.display_name || 'Unknown'
      })));
    } catch (error) {
      console.error('Error loading user transmissions:', error);
    } finally {
      setLoadingUserProfile(false);
    }
  }, [following, discoverUsers, searchResults]);

  const handleViewUserProfile = useCallback((user: UserProfile) => {
    setSelectedUser(user);
    loadUserTransmissions(user.id);
  }, [loadUserTransmissions]);

  const handleBackFromProfile = useCallback(() => {
    setSelectedUser(null);
    setSelectedUserTransmissions([]);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  }, [searchQuery, searchUsers]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) handleSearch();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, handleSearch]);

  const handleFollow = async (userId: string) => {
    const success = await followUser(userId);
    if (success) {
      toast({ title: 'Following', description: 'You are now following this user' });
      // Refresh discover list
      loadDiscoverUsers();
    }
  };

  const handleUnfollow = async (userId: string) => {
    const success = await unfollowUser(userId);
    if (success) {
      toast({ title: 'Unfollowed', description: 'You have unfollowed this user' });
    }
  };

  const handleClose = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setSelectedUser(null);
          setSelectedUserTransmissions([]);
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  // Check if user is a mutual follow (they follow you back)
  const isMutualFollow = (userId: string) => {
    const theyFollowYou = followers.some(f => f.id === userId);
    const youFollowThem = isFollowing(userId);
    return theyFollowYou && youFollowThem;
  };

  if (!isOpen) return null;


  const UserCard = ({ user, showFollow = true, onClick }: { user: UserWithStats; showFollow?: boolean; onClick?: () => void }) => {
    const mutual = isMutualFollow(user.id);
    
    return (
      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
        <button 
          onClick={onClick}
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-slate-700 text-slate-300">
                {user.display_name?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            {mutual && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-800" title="Mutual follow">
                <ArrowLeftRight className="w-3 h-3 text-white" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-slate-200 font-medium">{user.display_name || user.id.slice(0, 8)}</p>
              {mutual && (
                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-medium">
                  Mutual
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {user.transmission_count !== undefined && (
                <span>{user.transmission_count} books</span>
              )}
              {user.transmission_count !== undefined && user.follower_count !== undefined && (
                <span>•</span>
              )}
              {user.follower_count !== undefined && (
                <span>{user.follower_count} followers</span>
              )}
              {user.transmission_count === undefined && user.follower_count === undefined && user.bio && (
                <span className="line-clamp-1">{user.bio}</span>
              )}
            </div>
          </div>
        </button>
        {showFollow && (
          <div onClick={(e) => e.stopPropagation()}>
            {isFollowing(user.id) ? (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleUnfollow(user.id)}
                className="gap-1"
              >
                <UserMinus className="w-4 h-4" />
                Unfollow
              </Button>
            ) : (
              <Button 
                size="sm" 
                onClick={() => handleFollow(user.id)}
                className="gap-1"
              >
                <UserPlus className="w-4 h-4" />
                Follow
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // User Profile View
  if (selectedUser) {
    return createPortal(
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div 
          ref={modalRef}
          className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackFromProfile}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedUser.avatar_url || undefined} />
                <AvatarFallback className="bg-slate-700 text-slate-300">
                  {selectedUser.display_name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">{selectedUser.display_name || selectedUser.id.slice(0, 8)}</h2>
                {selectedUser.bio && (
                  <p className="text-xs text-slate-400 line-clamp-1">{selectedUser.bio}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isFollowing(selectedUser.id) ? (
                <Button size="sm" onClick={() => handleFollow(selectedUser.id)} className="gap-1">
                  <UserPlus className="w-4 h-4" />
                  Follow
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => handleUnfollow(selectedUser.id)} className="gap-1">
                  <UserMinus className="w-4 h-4" />
                  Unfollow
                </Button>
              )}
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Transmissions - Horizontal Scroll (covers only) */}
          <div className="p-4">
            {loadingUserProfile ? (
              <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="w-16 h-24 bg-slate-700/50 rounded animate-pulse flex-shrink-0" />
                ))}
              </div>
            ) : selectedUserTransmissions.length > 0 ? (
              <div className="relative">
                {/* Scroll buttons */}
                <button
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                    }
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-slate-800/90 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors shadow-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-slate-800/90 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors shadow-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {/* Scrollable book covers */}
                <div 
                  ref={scrollContainerRef}
                  className="flex gap-3 overflow-x-auto px-6 py-2 overscroll-x-contain [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {selectedUserTransmissions.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setPreviewBook({
                        id: `transmission-${t.id}`,
                        series_id: 'user-library',
                        title: t.title || 'Unknown',
                        author: t.author || 'Unknown',
                        cover_url: t.cover_url,
                        created_at: new Date().toISOString()
                      })}
                      className="flex-shrink-0 group cursor-pointer"
                      title={`${t.title} by ${t.author}`}
                    >
                      {t.cover_url ? (
                        <img
                          src={t.cover_url}
                          alt={t.title || 'Book cover'}
                          className="w-16 h-24 object-cover rounded shadow-md group-hover:scale-105 transition-transform"
                          loading="lazy"
                          onError={(e) => { 
                            (e.target as HTMLImageElement).style.display = 'none';
                            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-16 h-24 bg-slate-700 rounded flex items-center justify-center shadow-md ${t.cover_url ? 'hidden' : ''}`}>
                        <BookOpen className="w-6 h-6 text-slate-500" />
                      </div>
                    </button>
                  ))}
                </div>
                
                <p className="text-xs text-slate-500 mt-2 text-center">
                  {selectedUserTransmissions.length} books
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">No public transmissions yet</p>
              </div>
            )}
          </div>
          
          {/* Book Preview Modal */}
          {previewBook && (
            <EnhancedBookPreviewModal
              book={previewBook}
              onClose={() => setPreviewBook(null)}
              onAddBook={() => {}}
            />
          )}
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div 
        ref={modalRef}
        className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-100">Community</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Tabs defaultValue="discover" className="w-full" onValueChange={(v) => {
            if (v === 'discover') loadDiscoverUsers();
          }}>
            <TabsList className="w-full mb-4 grid grid-cols-5">
              <TabsTrigger value="discover" className="gap-1 text-xs sm:text-sm">
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Discover</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="text-xs sm:text-sm">Find</TabsTrigger>
              <TabsTrigger value="following" className="text-xs sm:text-sm">
                Following ({following.length})
              </TabsTrigger>
              <TabsTrigger value="followers" className="text-xs sm:text-sm">
                Followers ({followers.length})
              </TabsTrigger>
              <TabsTrigger value="feed" className="text-xs sm:text-sm">Feed</TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Active readers you might like</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadDiscoverUsers}
                  disabled={loadingDiscover}
                >
                  Refresh
                </Button>
              </div>
              
              {loadingDiscover ? (
                <p className="text-center text-slate-400 py-4">Finding readers...</p>
              ) : discoverUsers.length > 0 ? (
                <div className="space-y-2">
                  {discoverUsers.map(user => (
                    <UserCard 
                      key={user.id} 
                      user={user} 
                      onClick={() => handleViewUserProfile(user)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-4">
                  No new readers to discover right now
                </p>
              )}
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by display name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-800/50 border-slate-600"
                />
              </div>

              {isSearching && (
                <p className="text-center text-slate-400 py-4">Searching...</p>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map(user => (
                    <UserCard 
                      key={user.id} 
                      user={user} 
                      onClick={() => handleViewUserProfile(user)}
                    />
                  ))}
                </div>
              )}

              {!isSearching && searchQuery && searchResults.length === 0 && (
                <p className="text-center text-slate-400 py-4">No users found</p>
              )}

              {!searchQuery && (
                <p className="text-center text-slate-500 py-4 text-sm">
                  Search for other readers by their display name
                </p>
              )}
            </TabsContent>

            <TabsContent value="following" className="space-y-2">
              {loading ? (
                <p className="text-center text-slate-400 py-4">Loading...</p>
              ) : following.length > 0 ? (
                following.map(user => (
                  <UserCard 
                    key={user.id} 
                    user={user} 
                    onClick={() => handleViewUserProfile(user)}
                  />
                ))
              ) : (
                <p className="text-center text-slate-400 py-4">
                  You're not following anyone yet
                </p>
              )}
            </TabsContent>

            <TabsContent value="followers" className="space-y-2">
              {loading ? (
                <p className="text-center text-slate-400 py-4">Loading...</p>
              ) : followers.length > 0 ? (
                followers.map(user => (
                  <UserCard 
                    key={user.id} 
                    user={user} 
                    onClick={() => handleViewUserProfile(user)}
                  />
                ))
              ) : (
                <p className="text-center text-slate-400 py-4">
                  No followers yet. Share your profile to grow your community!
                </p>
              )}
            </TabsContent>

            <TabsContent value="feed" className="space-y-6">
              {loadingTransmissions ? (
                <p className="text-center text-slate-400 py-4">Loading feed...</p>
              ) : followedTransmissions.length > 0 ? (
                // Group transmissions by user
                Object.entries(
                  followedTransmissions.reduce((acc, t) => {
                    const key = t.user_id;
                    if (!acc[key]) acc[key] = { name: t.user_display_name || 'Unknown', transmissions: [] };
                    acc[key].transmissions.push(t);
                    return acc;
                  }, {} as Record<string, { name: string; transmissions: FollowedTransmission[] }>)
                ).map(([userId, { name, transmissions: userTransmissions }]) => (
                  <div key={userId} className="space-y-3">
                    <button 
                      onClick={() => {
                        const user = following.find(f => f.id === userId);
                        if (user) handleViewUserProfile(user);
                      }}
                      className="flex items-center gap-2 pb-2 border-b border-slate-700 hover:opacity-80 transition-opacity w-full text-left group"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                          {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-slate-200">{name}</span>
                      <span className="relative text-xs text-primary font-medium cursor-pointer">
                        ({userTransmissions.length} books) →
                        <span className="absolute bottom-0 left-0 w-full h-[1px] bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                      </span>
                    </button>
                    <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {userTransmissions.slice(0, 10).map(t => (
                        <button
                          key={t.id}
                          onClick={() => setPreviewBook({
                            id: `transmission-${t.id}`,
                            series_id: 'user-library',
                            title: t.title || 'Unknown',
                            author: t.author || 'Unknown',
                            cover_url: t.cover_url,
                            created_at: new Date().toISOString()
                          })}
                          className="flex-shrink-0 group cursor-pointer"
                          title={`${t.title} by ${t.author}`}
                        >
                          {t.cover_url ? (
                            <img
                              src={t.cover_url}
                              alt={t.title || 'Book cover'}
                              className="w-20 h-[120px] object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform"
                              loading="lazy"
                              onError={(e) => { 
                                (e.target as HTMLImageElement).style.display = 'none';
                                const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-20 h-[120px] bg-slate-700 rounded-lg flex items-center justify-center shadow-md ${t.cover_url ? 'hidden' : ''}`}>
                            <BookOpen className="w-5 h-5 text-slate-500" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : following.length === 0 ? (
                <p className="text-center text-slate-400 py-4">
                  Follow other readers to see their transmissions
                </p>
              ) : (
                <p className="text-center text-slate-400 py-4">
                  No transmissions from people you follow yet
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>,
    document.body
  );
};
