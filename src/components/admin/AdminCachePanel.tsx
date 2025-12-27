import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw, Trash2, Loader2, Image } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { getCacheStats } from '@/services/imageCacheService';

interface CacheStats {
  totalCached: number;
  totalSize: number;
  bookCount: number;
  filmCount: number;
  oldestEntry?: string;
  newestEntry?: string;
}

export const AdminCachePanel: React.FC = () => {
  const { toast } = useEnhancedToast();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [recentImages, setRecentImages] = useState<Array<{
    id: string;
    original_url: string;
    cached_url: string;
    image_type: string;
    created_at: string;
    file_size: number | null;
  }>>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Get basic stats from service
      const basicStats = await getCacheStats();
      
      // Get additional info from DB
      const { data: entries, error } = await supabase
        .from('cached_images')
        .select('id, original_url, cached_url, image_type, created_at, file_size')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get date range
      const { data: oldest } = await supabase
        .from('cached_images')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      setStats({
        ...basicStats,
        oldestEntry: oldest?.created_at,
        newestEntry: entries?.[0]?.created_at,
      });
      
      setRecentImages(entries || []);
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      toast({ title: 'Error', description: 'Failed to fetch cache stats', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Delete cached images that haven\'t been accessed in 30+ days?')) return;
    
    setIsCleaning(true);
    try {
      // Get old entries (30+ days without access)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: oldEntries, error: fetchError } = await supabase
        .from('cached_images')
        .select('id, cached_path')
        .lt('last_accessed', thirtyDaysAgo.toISOString());

      if (fetchError) throw fetchError;

      if (!oldEntries?.length) {
        toast({ title: 'No Cleanup Needed', description: 'No old cache entries found', variant: 'default' });
        setIsCleaning(false);
        return;
      }

      // Delete from storage (batch delete)
      const paths = oldEntries.map(e => e.cached_path);
      const { error: storageError } = await supabase.storage
        .from('book-covers')
        .remove(paths);

      if (storageError) {
        console.warn('Storage cleanup partial failure:', storageError);
      }

      // Delete from database
      const ids = oldEntries.map(e => e.id);
      const { error: dbError } = await supabase
        .from('cached_images')
        .delete()
        .in('id', ids);

      if (dbError) throw dbError;

      toast({
        title: 'Cleanup Complete',
        description: `Removed ${oldEntries.length} old cached images`,
        variant: 'success',
      });

      fetchStats();
    } catch (error) {
      console.error('Error cleaning cache:', error);
      toast({ title: 'Error', description: 'Failed to clean cache', variant: 'destructive' });
    } finally {
      setIsCleaning(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Estimate storage usage (assuming 50KB avg per image if no size data)
  const estimatedSize = stats?.totalSize || (stats?.totalCached || 0) * 50000;
  const maxStorage = 1024 * 1024 * 1024; // 1GB limit estimate
  const usagePercent = Math.min((estimatedSize / maxStorage) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            <CardTitle>Image Cache Management</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanup}
              disabled={isCleaning}
              className="text-red-400 border-red-400/30 hover:bg-red-400/10"
            >
              {isCleaning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Cleanup Old
            </Button>
            <Button variant="outline" size="sm" onClick={fetchStats} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          View cached images statistics and manage storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.totalCached}</p>
                <p className="text-xs text-muted-foreground">Total Cached</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{stats.bookCount}</p>
                <p className="text-xs text-muted-foreground">Book Covers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{stats.filmCount}</p>
                <p className="text-xs text-muted-foreground">Film Posters</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{formatBytes(estimatedSize)}</p>
                <p className="text-xs text-muted-foreground">Storage Used</p>
              </div>
            </div>

            {/* Storage Usage Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Storage Usage</span>
                <span className="text-foreground">{usagePercent.toFixed(1)}%</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {formatBytes(estimatedSize)} of ~1GB estimated limit
              </p>
            </div>

            {/* Date Range */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Oldest: {formatDate(stats.oldestEntry)}</span>
              <span>•</span>
              <span>Newest: {formatDate(stats.newestEntry)}</span>
            </div>

            {/* Recent Cached Images */}
            {recentImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Recently Cached</p>
                <div className="grid grid-cols-5 gap-2">
                  {recentImages.slice(0, 5).map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-[2/3] bg-muted/50 rounded overflow-hidden group"
                    >
                      <img
                        src={img.cached_url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] text-white capitalize">{img.image_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/30">
              <p>• Images are cached to Supabase Storage for faster repeated loads</p>
              <p>• Book covers use Google Books zoom=2 for high quality</p>
              <p>• Film posters use TMDB w780 size for optimal display</p>
              <p>• Cleanup removes images not accessed in 30+ days</p>
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-4">No cache data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCachePanel;
