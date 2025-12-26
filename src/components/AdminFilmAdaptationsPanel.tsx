import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { 
  Film, Plus, Pencil, Trash2, RefreshCw, Image, Video, 
  Star, BookOpen, Loader2, Search, Check, Sparkles, Play, Award
} from "lucide-react";

interface StreamingAvailability {
  criterion?: string;
  apple?: string;
  netflix?: string;
  prime?: string;
  hbo?: string;
  [key: string]: string | undefined;
}

interface FilmAdaptation {
  id: string;
  book_title: string;
  book_author: string;
  book_publication_year: number | null;
  book_cover_url: string | null;
  film_title: string;
  film_year: number | null;
  director: string | null;
  imdb_rating: number | null;
  poster_url: string | null;
  trailer_url: string | null;
  criterion_spine: number | null;
  is_criterion_collection: boolean | null;
  streaming_availability: StreamingAvailability | null;
}

const emptyFilm: Partial<FilmAdaptation> = {
  book_title: '',
  book_author: '',
  book_publication_year: null,
  book_cover_url: '',
  film_title: '',
  film_year: null,
  director: '',
  imdb_rating: null,
  poster_url: '',
  trailer_url: '',
  criterion_spine: null,
  streaming_availability: {},
};

export const AdminFilmAdaptationsPanel = () => {
  const [films, setFilms] = useState<FilmAdaptation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopulating, setIsPopulating] = useState(false);
  const [isPopulatingCriterion, setIsPopulatingCriterion] = useState(false);
  const [isEnrichingArtwork, setIsEnrichingArtwork] = useState(false);
  const [isEnrichingTrailers, setIsEnrichingTrailers] = useState(false);
  const [isEnrichingCriterion, setIsEnrichingCriterion] = useState(false);
  const [isEnrichingAppleTV, setIsEnrichingAppleTV] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFilm, setEditingFilm] = useState<Partial<FilmAdaptation> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useEnhancedToast();

  const fetchFilms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sf_film_adaptations')
        .select('*')
        .order('film_year', { ascending: false });

      if (error) throw error;
      setFilms((data || []).map(f => ({
        ...f,
        streaming_availability: typeof f.streaming_availability === 'object' ? f.streaming_availability as Record<string, string> : null
      })));
    } catch (error) {
      console.error('Error fetching films:', error);
      toast({
        title: "Error",
        description: "Failed to fetch film adaptations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilms();
  }, []);

  const handlePopulate = async () => {
    setIsPopulating(true);
    try {
      const { data, error } = await supabase.functions.invoke('populate-film-adaptations');
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Populated ${data.count} film adaptations`,
        variant: "success"
      });
      fetchFilms();
    } catch (error) {
      console.error('Error populating films:', error);
      toast({
        title: "Error",
        description: "Failed to populate film adaptations",
        variant: "destructive"
      });
    } finally {
      setIsPopulating(false);
    }
  };

  const handlePopulateCriterion = async () => {
    setIsPopulatingCriterion(true);
    try {
      toast({ title: "Starting", description: "Populating Criterion SF films..." });
      
      const { data, error } = await supabase.functions.invoke('populate-criterion-sf-films');
      if (error) throw error;
      
      toast({
        title: "Criterion Population Complete",
        description: data.message || `Processed Criterion films`,
        variant: "success"
      });
      fetchFilms();
    } catch (error) {
      console.error('Error populating Criterion:', error);
      toast({
        title: "Error",
        description: "Failed to populate Criterion films",
        variant: "destructive"
      });
    } finally {
      setIsPopulatingCriterion(false);
    }
  };

  const handleEnrichArtwork = async () => {
    setIsEnrichingArtwork(true);
    try {
      toast({ title: "Starting", description: "Enriching film artwork from TMDB and Google Books..." });
      
      const { data, error } = await supabase.functions.invoke('enrich-film-artwork');
      if (error) throw error;
      
      toast({
        title: "Artwork Enrichment Complete",
        description: data.message || `Updated artwork`,
        variant: "success"
      });
      fetchFilms();
    } catch (error) {
      console.error('Error enriching artwork:', error);
      toast({
        title: "Error",
        description: "Failed to enrich artwork",
        variant: "destructive"
      });
    } finally {
      setIsEnrichingArtwork(false);
    }
  };

  const handleEnrichTrailers = async () => {
    setIsEnrichingTrailers(true);
    try {
      toast({ title: "Starting", description: "Searching YouTube for official trailers..." });
      
      const { data, error } = await supabase.functions.invoke('enrich-trailer-urls');
      if (error) throw error;
      
      toast({
        title: "Trailer Enrichment Complete",
        description: data.message || `Updated trailers`,
        variant: "success"
      });
      fetchFilms();
    } catch (error) {
      console.error('Error enriching trailers:', error);
      toast({
        title: "Error",
        description: "Failed to enrich trailers",
        variant: "destructive"
      });
    } finally {
      setIsEnrichingTrailers(false);
    }
  };

  const handleEnrichCriterion = async () => {
    setIsEnrichingCriterion(true);
    try {
      toast({ title: "Starting", description: "Enriching Criterion links..." });
      
      const { data, error } = await supabase.functions.invoke('enrich-criterion-links');
      if (error) throw error;
      
      toast({
        title: "Criterion Enrichment Complete",
        description: data.message || `Updated streaming links`,
        variant: "success"
      });
      fetchFilms();
    } catch (error) {
      console.error('Error enriching Criterion:', error);
      toast({
        title: "Error",
        description: "Failed to enrich Criterion links",
        variant: "destructive"
      });
    } finally {
      setIsEnrichingCriterion(false);
    }
  };

  const handleEnrichAppleTV = async () => {
    setIsEnrichingAppleTV(true);
    try {
      toast({ title: "Starting", description: "Enriching Apple TV links..." });
      
      const { data, error } = await supabase.functions.invoke('enrich-apple-tv-links');
      if (error) throw error;
      
      toast({
        title: "Apple TV Enrichment Complete",
        description: data.message || `Updated streaming links`,
        variant: "success"
      });
      fetchFilms();
    } catch (error) {
      console.error('Error enriching Apple TV:', error);
      toast({
        title: "Error",
        description: "Failed to enrich Apple TV links",
        variant: "destructive"
      });
    } finally {
      setIsEnrichingAppleTV(false);
    }
  };

  const handleRunAllEnrichment = async () => {
    setIsRunningAll(true);
    toast({ title: "Running All Enrichment", description: "This may take a few minutes..." });
    
    try {
      // Run in sequence to avoid overwhelming APIs
      await handlePopulateCriterion();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await handleEnrichArtwork();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await handleEnrichTrailers();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await handleEnrichCriterion();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await handleEnrichAppleTV();
      
      toast({
        title: "All Enrichment Complete",
        description: "All enrichment functions have run successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('Error running all enrichment:', error);
      toast({
        title: "Error",
        description: "Some enrichment functions failed",
        variant: "destructive"
      });
    } finally {
      setIsRunningAll(false);
      fetchFilms();
    }
  };

  const handleSave = async () => {
    if (!editingFilm) return;
    setIsSaving(true);

    try {
      const cleanedStreaming = editingFilm.streaming_availability 
        ? Object.fromEntries(
            Object.entries(editingFilm.streaming_availability).filter(([_, v]) => v && v.trim() !== '')
          )
        : null;

      const filmData = {
        book_title: editingFilm.book_title,
        book_author: editingFilm.book_author,
        book_publication_year: editingFilm.book_publication_year,
        book_cover_url: editingFilm.book_cover_url || null,
        film_title: editingFilm.film_title,
        film_year: editingFilm.film_year,
        director: editingFilm.director || null,
        imdb_rating: editingFilm.imdb_rating,
        poster_url: editingFilm.poster_url || null,
        trailer_url: editingFilm.trailer_url || null,
        criterion_spine: editingFilm.criterion_spine,
        streaming_availability: cleanedStreaming && Object.keys(cleanedStreaming).length > 0 ? cleanedStreaming : null,
      };

      if (editingFilm.id) {
        const { error } = await supabase
          .from('sf_film_adaptations')
          .update(filmData)
          .eq('id', editingFilm.id);

        if (error) throw error;
        toast({ title: "Updated", description: "Film adaptation updated successfully", variant: "success" });
      } else {
        const { error } = await supabase
          .from('sf_film_adaptations')
          .insert([filmData]);

        if (error) throw error;
        toast({ title: "Created", description: "Film adaptation created successfully", variant: "success" });
      }

      setIsDialogOpen(false);
      setEditingFilm(null);
      fetchFilms();
    } catch (error: any) {
      console.error('Error saving film:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save film adaptation",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this film adaptation?')) return;

    try {
      const { error } = await supabase
        .from('sf_film_adaptations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Deleted", description: "Film adaptation deleted", variant: "success" });
      fetchFilms();
    } catch (error: any) {
      console.error('Error deleting film:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete film adaptation",
        variant: "destructive"
      });
    }
  };

  const filteredFilms = films.filter(f => 
    f.film_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.book_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.director && f.director.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: films.length,
    withPosters: films.filter(f => f.poster_url).length,
    withBookCovers: films.filter(f => f.book_cover_url).length,
    withTrailers: films.filter(f => f.trailer_url).length,
    criterion: films.filter(f => f.is_criterion_collection).length,
    withCriterionLinks: films.filter(f => f.streaming_availability?.criterion).length,
    withAppleTVLinks: films.filter(f => f.streaming_availability?.apple).length,
  };

  const missingPosters = stats.total - stats.withPosters;
  const missingCovers = stats.total - stats.withBookCovers;
  const missingTrailers = stats.total - stats.withTrailers;

  return (
    <Card className="border-amber-700/50 bg-gradient-to-br from-amber-900/20 to-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-amber-100">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            Film Adaptations Management
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFilms}
              disabled={isLoading}
              className="border-amber-500/30 text-amber-300"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunAllEnrichment}
              disabled={isRunningAll}
              className="border-emerald-500/30 text-emerald-300 bg-emerald-900/20"
            >
              {isRunningAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="ml-1">Run All</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => setEditingFilm({ ...emptyFilm })}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Film
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-amber-500/30">
                <DialogHeader>
                  <DialogTitle className="text-amber-100">
                    {editingFilm?.id ? 'Edit Film Adaptation' : 'Add Film Adaptation'}
                  </DialogTitle>
                </DialogHeader>
                
                {editingFilm && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Book Title *</Label>
                        <Input
                          value={editingFilm.book_title || ''}
                          onChange={e => setEditingFilm({ ...editingFilm, book_title: e.target.value })}
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Book Author *</Label>
                        <Input
                          value={editingFilm.book_author || ''}
                          onChange={e => setEditingFilm({ ...editingFilm, book_author: e.target.value })}
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Film Title *</Label>
                        <Input
                          value={editingFilm.film_title || ''}
                          onChange={e => setEditingFilm({ ...editingFilm, film_title: e.target.value })}
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Director</Label>
                        <Input
                          value={editingFilm.director || ''}
                          onChange={e => setEditingFilm({ ...editingFilm, director: e.target.value })}
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Book Year</Label>
                        <Input
                          type="number"
                          value={editingFilm.book_publication_year || ''}
                          onChange={e => setEditingFilm({ ...editingFilm, book_publication_year: parseInt(e.target.value) || null })}
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Film Year</Label>
                        <Input
                          type="number"
                          value={editingFilm.film_year || ''}
                          onChange={e => setEditingFilm({ ...editingFilm, film_year: parseInt(e.target.value) || null })}
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">IMDB Rating</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={editingFilm.imdb_rating || ''}
                          onChange={e => setEditingFilm({ ...editingFilm, imdb_rating: parseFloat(e.target.value) || null })}
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Criterion Spine</Label>
                        <Input
                          type="number"
                          value={editingFilm.criterion_spine || ''}
                          onChange={e => setEditingFilm({ ...editingFilm, criterion_spine: parseInt(e.target.value) || null })}
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Book Cover URL</Label>
                      <Input
                        value={editingFilm.book_cover_url || ''}
                        onChange={e => setEditingFilm({ ...editingFilm, book_cover_url: e.target.value })}
                        placeholder="https://..."
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Film Poster URL</Label>
                      <Input
                        value={editingFilm.poster_url || ''}
                        onChange={e => setEditingFilm({ ...editingFilm, poster_url: e.target.value })}
                        placeholder="https://..."
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Trailer URL (YouTube)</Label>
                      <Input
                        value={editingFilm.trailer_url || ''}
                        onChange={e => setEditingFilm({ ...editingFilm, trailer_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-700">
                      <Label className="text-amber-300 font-medium">Streaming Availability</Label>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-300 text-sm">Criterion URL</Label>
                          <Input
                            value={editingFilm.streaming_availability?.criterion || ''}
                            onChange={e => setEditingFilm({ 
                              ...editingFilm, 
                              streaming_availability: { 
                                ...editingFilm.streaming_availability, 
                                criterion: e.target.value || undefined 
                              } 
                            })}
                            placeholder="https://www.criterion.com/films/..."
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300 text-sm">Apple TV URL</Label>
                          <Input
                            value={editingFilm.streaming_availability?.apple || ''}
                            onChange={e => setEditingFilm({ 
                              ...editingFilm, 
                              streaming_availability: { 
                                ...editingFilm.streaming_availability, 
                                apple: e.target.value || undefined 
                              } 
                            })}
                            placeholder="https://tv.apple.com/movie/..."
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                      {editingFilm.book_cover_url && (
                        <div className="space-y-2">
                          <Label className="text-slate-400 text-xs">Book Cover Preview</Label>
                          <img 
                            src={editingFilm.book_cover_url} 
                            alt="Book cover" 
                            className="h-32 rounded object-cover"
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                          />
                        </div>
                      )}
                      {editingFilm.poster_url && (
                        <div className="space-y-2">
                          <Label className="text-slate-400 text-xs">Poster Preview</Label>
                          <img 
                            src={editingFilm.poster_url} 
                            alt="Film poster" 
                            className="h-32 rounded object-cover"
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="border-slate-600">Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || !editingFilm?.book_title || !editingFilm?.film_title}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    {editingFilm?.id ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
        <CardDescription className="text-amber-200/70">
          Manage SF film adaptations with posters, trailers, and streaming links
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enrichment Buttons Row */}
        <div className="flex flex-wrap gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePopulate}
            disabled={isPopulating}
            className="border-blue-500/30 text-blue-300"
          >
            {isPopulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-1">Populate Films</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePopulateCriterion}
            disabled={isPopulatingCriterion}
            className="border-yellow-500/30 text-yellow-300"
          >
            {isPopulatingCriterion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
            <span className="ml-1">Criterion SF ({stats.criterion})</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnrichArtwork}
            disabled={isEnrichingArtwork}
            className="border-purple-500/30 text-purple-300"
          >
            {isEnrichingArtwork ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
            <span className="ml-1">Artwork ({missingPosters + missingCovers} missing)</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnrichTrailers}
            disabled={isEnrichingTrailers}
            className="border-red-500/30 text-red-300"
          >
            {isEnrichingTrailers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span className="ml-1">Trailers ({missingTrailers} missing)</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnrichCriterion}
            disabled={isEnrichingCriterion}
            className="border-amber-500/30 text-amber-300"
          >
            {isEnrichingCriterion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="ml-1">Criterion Links</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnrichAppleTV}
            disabled={isEnrichingAppleTV}
            className="border-slate-500/30 text-slate-300"
          >
            {isEnrichingAppleTV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="ml-1">Apple TV</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-7 gap-2">
          <div className="bg-slate-900/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.total}</div>
            <div className="text-xs text-slate-400">Total Films</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-emerald-400">
              {stats.withPosters}
              {stats.withPosters === stats.total && <Check className="w-4 h-4" />}
            </div>
            <div className="text-xs text-slate-400">Posters</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-400">
              {stats.withBookCovers}
            </div>
            <div className="text-xs text-slate-400">Book Covers</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.withTrailers}</div>
            <div className="text-xs text-slate-400">Trailers</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.criterion}</div>
            <div className="text-xs text-slate-400">Criterion</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-amber-300">{stats.withCriterionLinks}</div>
            <div className="text-xs text-slate-400">Criterion Links</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-slate-300">{stats.withAppleTVLinks}</div>
            <div className="text-xs text-slate-400">Apple TV Links</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search films, books, or directors..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700"
          />
        </div>

        {/* Films Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : (
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                  <TableHead className="text-slate-300 w-[80px]">Poster</TableHead>
                  <TableHead className="text-slate-300">Film</TableHead>
                  <TableHead className="text-slate-300">Book</TableHead>
                  <TableHead className="text-slate-300">Director</TableHead>
                  <TableHead className="text-slate-300 text-center">Year</TableHead>
                  <TableHead className="text-slate-300 text-center">Rating</TableHead>
                  <TableHead className="text-slate-300 text-center">Media</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFilms.map((film) => (
                  <TableRow key={film.id} className="hover:bg-slate-800/30">
                    <TableCell>
                      {film.poster_url ? (
                        <img 
                          src={film.poster_url} 
                          alt={film.film_title}
                          className="w-12 h-16 object-cover rounded"
                          onError={(e) => (e.target as HTMLImageElement).src = '/placeholder.svg'}
                        />
                      ) : (
                        <div className="w-12 h-16 bg-slate-700 rounded flex items-center justify-center">
                          <Film className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{film.film_title}</TableCell>
                    <TableCell className="text-slate-400">
                      <div className="flex flex-col">
                        <span className="text-sm">{film.book_title}</span>
                        <span className="text-xs text-slate-500">by {film.book_author}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400">{film.director || '—'}</TableCell>
                    <TableCell className="text-center text-slate-400">{film.film_year}</TableCell>
                    <TableCell className="text-center">
                      {film.imdb_rating ? (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30">
                          <Star className="w-3 h-3 mr-1 fill-amber-400" />
                          {film.imdb_rating}
                        </Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {film.poster_url && <span title="Has poster"><Image className="w-4 h-4 text-emerald-400" /></span>}
                        {film.book_cover_url && <span title="Has book cover"><BookOpen className="w-4 h-4 text-blue-400" /></span>}
                        {film.trailer_url && <span title="Has trailer"><Video className="w-4 h-4 text-red-400" /></span>}
                        {film.is_criterion_collection && (
                          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-[10px] px-1">
                            C
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingFilm(film);
                            setIsDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-amber-400"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(film.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
