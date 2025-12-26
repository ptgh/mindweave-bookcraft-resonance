import React, { useState, useEffect } from 'react';
import { Link2, Search, Edit2, ExternalLink, RefreshCw, Loader2, CheckCircle, XCircle, Tv, Film, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getAppleTVLink, getCriterionLink, hasValidStreamingLink, CRITERION_SF_FILMS } from '@/utils/streamingLinks';

interface FilmStreamingData {
  id: string;
  film_title: string;
  streaming_availability: Record<string, string> | null;
  criterion_url: string | null;
  poster_url: string | null;
}

export const AdminExternalLinksPanel: React.FC = () => {
  const { toast } = useEnhancedToast();
  const [films, setFilms] = useState<FilmStreamingData[]>([]);
  const [filteredFilms, setFilteredFilms] = useState<FilmStreamingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFilm, setEditingFilm] = useState<FilmStreamingData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnrichingCriterion, setIsEnrichingCriterion] = useState(false);
  const [isEnrichingAppleTV, setIsEnrichingAppleTV] = useState(false);
  const [stats, setStats] = useState({ 
    total: 0, 
    validApple: 0, 
    validCriterion: 0, 
    criterionPotential: 0 
  });

  // Form state for streaming URLs
  const [formAppleUrl, setFormAppleUrl] = useState('');
  const [formCriterionUrl, setFormCriterionUrl] = useState('');

  useEffect(() => {
    fetchFilms();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredFilms(films.filter(f => f.film_title.toLowerCase().includes(q)));
    } else {
      setFilteredFilms(films);
    }
  }, [searchQuery, films]);

  const fetchFilms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sf_film_adaptations')
        .select('id, film_title, streaming_availability, criterion_url, poster_url')
        .order('film_title');

      if (error) throw error;
      const mapped = (data || []).map(item => ({
        ...item,
        streaming_availability: typeof item.streaming_availability === 'object' 
          ? item.streaming_availability as Record<string, string>
          : null
      })) as FilmStreamingData[];
      setFilms(mapped);
      setFilteredFilms(mapped);
      
      const validApple = mapped.filter(f => hasValidStreamingLink(f.streaming_availability, 'apple')).length;
      const validCriterion = mapped.filter(f => hasValidStreamingLink(f.streaming_availability, 'criterion')).length;
      const criterionPotential = mapped.filter(f => 
        CRITERION_SF_FILMS.some(cf => 
          f.film_title.toLowerCase().includes(cf.toLowerCase()) ||
          cf.toLowerCase().includes(f.film_title.toLowerCase())
        )
      ).length;
      
      setStats({
        total: mapped.length,
        validApple,
        validCriterion,
        criterionPotential,
      });
    } catch (error) {
      console.error('Error fetching films:', error);
      toast({ title: 'Error', description: 'Failed to fetch films', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrichCriterion = async () => {
    setIsEnrichingCriterion(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-criterion-links');
      if (error) throw error;
      toast({
        title: 'Criterion Enrichment Complete',
        description: data?.message || 'Links updated',
        variant: 'success',
      });
      fetchFilms();
    } catch (error) {
      console.error('Error enriching Criterion:', error);
      toast({ title: 'Error', description: 'Failed to enrich Criterion links', variant: 'destructive' });
    } finally {
      setIsEnrichingCriterion(false);
    }
  };

  const handleEnrichAppleTV = async () => {
    setIsEnrichingAppleTV(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-apple-tv-links');
      if (error) throw error;
      toast({
        title: 'Apple TV Enrichment Complete',
        description: data?.message || 'Links cleaned',
        variant: 'success',
      });
      fetchFilms();
    } catch (error) {
      console.error('Error enriching Apple TV:', error);
      toast({ title: 'Error', description: 'Failed to enrich Apple TV links', variant: 'destructive' });
    } finally {
      setIsEnrichingAppleTV(false);
    }
  };

  const handleEdit = (film: FilmStreamingData) => {
    setEditingFilm({ ...film });
    setFormAppleUrl(film.streaming_availability?.apple || '');
    setFormCriterionUrl(film.streaming_availability?.criterion || '');
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingFilm) return;
    setIsSaving(true);
    try {
      const updatedStreaming: Record<string, string> = {};
      if (formAppleUrl.trim()) updatedStreaming.apple = formAppleUrl.trim();
      if (formCriterionUrl.trim()) updatedStreaming.criterion = formCriterionUrl.trim();

      const { error } = await supabase
        .from('sf_film_adaptations')
        .update({ 
          streaming_availability: Object.keys(updatedStreaming).length > 0 ? updatedStreaming : null 
        })
        .eq('id', editingFilm.id);

      if (error) throw error;
      toast({ title: 'Saved', description: 'Streaming links updated', variant: 'success' });
      setShowEditModal(false);
      fetchFilms();
    } catch (error) {
      console.error('Error saving links:', error);
      toast({ title: 'Error', description: 'Failed to save links', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const openAppleTVSearch = (filmTitle: string) => {
    window.open(getAppleTVLink(filmTitle), '_blank');
  };

  const openCriterionSearch = (filmTitle: string) => {
    window.open(getCriterionLink(filmTitle), '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-purple-400" />
            <CardTitle>External Links Management</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnrichCriterion}
              disabled={isEnrichingCriterion}
            >
              {isEnrichingCriterion ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <img src="/images/criterion-logo.jpg" alt="" className="w-4 h-4 mr-2 rounded-sm" />
              )}
              Criterion
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnrichAppleTV}
              disabled={isEnrichingAppleTV}
            >
              {isEnrichingAppleTV ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Tv className="w-4 h-4 mr-2" />
              )}
              Apple TV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchFilms}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Manage Apple TV and Criterion Collection links for films
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Films</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-400">{stats.validApple}</p>
            <p className="text-xs text-muted-foreground">Valid Apple TV</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.validCriterion}</p>
            <p className="text-xs text-muted-foreground">Valid Criterion</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.criterionPotential}</p>
            <p className="text-xs text-muted-foreground">Criterion Candidates</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search films..."
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
              const hasApple = hasValidStreamingLink(film.streaming_availability, 'apple');
              const hasCriterion = hasValidStreamingLink(film.streaming_availability, 'criterion');
              const isCriterionCandidate = CRITERION_SF_FILMS.some(cf => 
                film.film_title.toLowerCase().includes(cf.toLowerCase()) ||
                cf.toLowerCase().includes(film.film_title.toLowerCase())
              );
              
              return (
                <div
                  key={film.id}
                  className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border/30 hover:border-purple-400/30 transition-colors"
                >
                  {/* Poster Preview */}
                  <div className="w-10 h-14 bg-muted/50 rounded overflow-hidden flex-shrink-0">
                    {film.poster_url ? (
                      <img src={film.poster_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{film.film_title}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hasApple ? (
                        <Badge variant="outline" className="text-[10px] border-slate-500/30 text-slate-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Apple TV
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-slate-800/30 text-slate-500">
                          <XCircle className="w-3 h-3 mr-1" />
                          Apple TV
                        </Badge>
                      )}
                      {hasCriterion ? (
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Criterion
                        </Badge>
                      ) : isCriterionCandidate ? (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Criterion Candidate
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => openAppleTVSearch(film.film_title)}
                      title="Search Apple TV"
                    >
                      <Tv className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => openCriterionSearch(film.film_title)}
                      title="Search Criterion"
                    >
                      <img src="/images/criterion-logo.jpg" alt="" className="w-4 h-4 rounded-sm" />
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
              <DialogTitle>Edit Links - {editingFilm?.film_title}</DialogTitle>
            </DialogHeader>
            {editingFilm && (
              <div className="space-y-4">
                <div>
                  <Label>Apple TV URL</Label>
                  <Input
                    value={formAppleUrl}
                    onChange={(e) => setFormAppleUrl(e.target.value)}
                    placeholder="https://tv.apple.com/movie/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must have format: tv.apple.com/movie/title/umc.cmc.XXXXXX
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => openAppleTVSearch(editingFilm.film_title)}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Find on Apple TV
                  </Button>
                </div>
                
                <div>
                  <Label>Criterion URL</Label>
                  <Input
                    value={formCriterionUrl}
                    onChange={(e) => setFormCriterionUrl(e.target.value)}
                    placeholder="https://www.criterion.com/films/12345-title"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be a direct film page: criterion.com/films/####-slug
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => openCriterionSearch(editingFilm.film_title)}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Find on Criterion
                  </Button>
                </div>

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

export default AdminExternalLinksPanel;
