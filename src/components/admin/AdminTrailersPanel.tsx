import React, { useState, useEffect } from 'react';
import { Play, Search, Edit2, ExternalLink, RefreshCw, Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { extractYouTubeId } from '@/utils/streamingLinks';

interface FilmTrailer {
  id: string;
  film_title: string;
  trailer_url: string | null;
  poster_url: string | null;
  director: string | null;
  film_year: number | null;
}

export const AdminTrailersPanel: React.FC = () => {
  const { toast } = useEnhancedToast();
  const [films, setFilms] = useState<FilmTrailer[]>([]);
  const [filteredFilms, setFilteredFilms] = useState<FilmTrailer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFilm, setEditingFilm] = useState<FilmTrailer | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [stats, setStats] = useState({ total: 0, withTrailer: 0, validTrailers: 0 });

  useEffect(() => {
    fetchFilms();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredFilms(films.filter(f => 
        f.film_title.toLowerCase().includes(q) || 
        f.director?.toLowerCase().includes(q)
      ));
    } else {
      setFilteredFilms(films);
    }
  }, [searchQuery, films]);

  const fetchFilms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sf_film_adaptations')
        .select('id, film_title, trailer_url, poster_url, director, film_year')
        .order('film_title');

      if (error) throw error;
      const mapped = (data || []) as FilmTrailer[];
      setFilms(mapped);
      setFilteredFilms(mapped);
      
      const withTrailer = mapped.filter(f => f.trailer_url);
      const validTrailers = withTrailer.filter(f => extractYouTubeId(f.trailer_url));
      
      setStats({
        total: mapped.length,
        withTrailer: withTrailer.length,
        validTrailers: validTrailers.length,
      });
    } catch (error) {
      console.error('Error fetching films:', error);
      toast({ title: 'Error', description: 'Failed to fetch films', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (film: FilmTrailer) => {
    setEditingFilm({ ...film });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingFilm) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('sf_film_adaptations')
        .update({ trailer_url: editingFilm.trailer_url })
        .eq('id', editingFilm.id);

      if (error) throw error;
      toast({ title: 'Saved', description: 'Trailer URL updated', variant: 'success' });
      setShowEditModal(false);
      fetchFilms();
    } catch (error) {
      console.error('Error saving trailer:', error);
      toast({ title: 'Error', description: 'Failed to save trailer', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSearch = (filmTitle: string) => {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(filmTitle + ' official trailer')}`;
    window.open(searchUrl, '_blank');
  };

  const isValidTrailer = (url: string | null): boolean => {
    return !!extractYouTubeId(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-red-400" />
            <CardTitle>Trailer Management</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={fetchFilms}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          Manage YouTube trailer links for film adaptations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Films</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{stats.withTrailer}</p>
            <p className="text-xs text-muted-foreground">With Trailers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.validTrailers}</p>
            <p className="text-xs text-muted-foreground">Valid YouTube</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search films by title or director..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Film List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredFilms.map((film) => {
              const hasValidTrailer = isValidTrailer(film.trailer_url);
              return (
                <div
                  key={film.id}
                  className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border/30 hover:border-red-400/30 transition-colors"
                >
                  {/* Poster Preview */}
                  <div className="w-10 h-14 bg-muted/50 rounded overflow-hidden flex-shrink-0">
                    {film.poster_url ? (
                      <img src={film.poster_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{film.film_title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {film.director && `${film.director} · `}{film.film_year}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {film.trailer_url ? (
                        hasValidTrailer ? (
                          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Valid Trailer
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                            <XCircle className="w-3 h-3 mr-1" />
                            Invalid URL
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">
                          No Trailer
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleAutoSearch(film.film_title)}
                      title="Search YouTube"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(film)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Trailer - {editingFilm?.film_title}</DialogTitle>
            </DialogHeader>
            {editingFilm && (
              <div className="space-y-4">
                <div>
                  <Label>YouTube Trailer URL</Label>
                  <Input
                    value={editingFilm.trailer_url || ''}
                    onChange={(e) => setEditingFilm({ ...editingFilm, trailer_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste a YouTube video URL or embed URL
                  </p>
                </div>
                
                {editingFilm.trailer_url && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    {isValidTrailer(editingFilm.trailer_url) ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Valid YouTube URL
                        </div>
                        <div className="aspect-video bg-black rounded overflow-hidden">
                          <iframe
                            src={`https://www.youtube.com/embed/${extractYouTubeId(editingFilm.trailer_url)}`}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-400 text-sm">
                        <XCircle className="w-4 h-4" />
                        Invalid YouTube URL format
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleAutoSearch(editingFilm.film_title)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Search YouTube for Trailer
                </Button>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminTrailersPanel;
