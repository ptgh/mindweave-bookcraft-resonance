import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, UserPlus, UserMinus, Users } from 'lucide-react';
import { useFollowing, UserProfile, FollowedTransmission } from '@/hooks/useFollowing';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedBookCover from '@/components/EnhancedBookCover';
import { useToast } from '@/hooks/use-toast';
import gsap from 'gsap';
import { useRef } from 'react';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
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
        onComplete: onClose
      });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const UserCard = ({ user, showFollow = true }: { user: UserProfile; showFollow?: boolean }) => (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className="bg-slate-700 text-slate-300">
            {user.display_name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-slate-200 font-medium">{user.display_name || 'Anonymous'}</p>
          {user.bio && (
            <p className="text-slate-400 text-xs line-clamp-1">{user.bio}</p>
          )}
        </div>
      </div>
      {showFollow && (
        isFollowing(user.id) ? (
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
        )
      )}
    </div>
  );

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
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="search" className="flex-1">Find Readers</TabsTrigger>
              <TabsTrigger value="following" className="flex-1">
                Following ({following.length})
              </TabsTrigger>
              <TabsTrigger value="feed" className="flex-1">Feed</TabsTrigger>
            </TabsList>

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
                    <UserCard key={user.id} user={user} />
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
                  <UserCard key={user.id} user={user} />
                ))
              ) : (
                <p className="text-center text-slate-400 py-4">
                  You're not following anyone yet
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
                    const key = t.user_display_name || 'Unknown';
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(t);
                    return acc;
                  }, {} as Record<string, FollowedTransmission[]>)
                ).map(([userName, userTransmissions]) => (
                  <div key={userName} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                          {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-slate-200">{userName}</span>
                      <span className="text-xs text-slate-500">({userTransmissions.length} books)</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {userTransmissions.slice(0, 8).map(t => (
                        <div key={t.id} className="group">
                          <EnhancedBookCover
                            title={t.title || ''}
                            author={t.author || ''}
                            coverUrl={t.cover_url || undefined}
                            className="w-full aspect-[2/3] rounded-lg"
                          />
                          <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 font-medium">
                            {t.title}
                          </p>
                        </div>
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
