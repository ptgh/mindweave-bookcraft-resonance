import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { invokeAdminFunction } from "@/utils/adminFunctions";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { 
  Film, Plus, Pencil, Trash2, RefreshCw, Image, 
  Loader2, Search, Sparkles, Play, FileText
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
  // Screenplay fields
  adaptation_type: string | null;
  script_url: string | null;
  script_source: string | null;
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
  // Screenplay fields
  adaptation_type: null,
  script_url: '',
  script_source: null,
};

export const AdminFilmAdaptationsPanel = () => {
  const [films, setFilms] = useState<FilmAdaptation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopulating, setIsPopulating] = useState(false);
  const [isEnrichingArtwork, setIsEnrichingArtwork] = useState(false);
  const [isEnrichingTrailers, setIsEnrichingTrailers] = useState(false);
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
      const { data, error } = await invokeAdminFunction('populate-film-adaptations');
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Populated ${(data as any).count} film adaptations`,
        variant: "success"
      });
      fetchFilms();
    } catch (error: any) {
      console.error('Error populating films:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to populate film adaptations",
        variant: "destructive"
      });
    } finally {
      setIsPopulating(false);
    }
  };

  // handlePopulateCriterion removed - deprecated feature

  const handleEnrichArtwork = async () => {
    setIsEnrichingArtwork(true);
    try {
      toast({ title: "Starting", description: "Enriching film artwork from TMDB and Google Books..." });
      
      const { data, error } = await invokeAdminFunction('enrich-film-artwork');
      if (error) throw error;
      
      toast({
        title: "Artwork Enrichment Complete",
        description: (data as any).message || `Updated artwork`,
        variant: "success"
      });
      fetchFilms();
    } catch (error: any) {
      console.error('Error enriching artwork:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to enrich artwork",
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
      
      const { data, error } = await invokeAdminFunction('enrich-trailer-urls');
      if (error) throw error;
      
      toast({
        title: "Trailer Enrichment Complete",
        description: (data as any).message || `Updated trailers`,
        variant: "success"
      });
      fetchFilms();
    } catch (error: any) {
      console.error('Error enriching trailers:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to enrich trailers",
        variant: "destructive"
      });
    } finally {
      setIsEnrichingTrailers(false);
    }
  };

  // handleEnrichCriterion and handleEnrichAppleTV removed - deprecated features

  const handleRunAllEnrichment = async () => {
    setIsRunningAll(true);
    toast({ title: "Running All Enrichment", description: "This may take a few minutes..." });
    
    try {
      // Run in sequence to avoid overwhelming APIs
      await handleEnrichArtwork();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await handleEnrichTrailers();
      
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
        // Screenplay fields
        adaptation_type: editingFilm.adaptation_type || null,
        script_url: editingFilm.script_url || null,
        script_source: editingFilm.script_source || null,
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
    withScripts: films.filter(f => f.script_url).length,
  };

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

                    {/* Screenplay Section - Only show for original screenplays */}
                    {editingFilm.adaptation_type === 'original' && (
                      <div className="space-y-3 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                        <h4 className="text-sm font-medium text-cyan-300 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Screenplay Data
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-300">Screenwriter(s)</Label>
                            <Input
                              value={editingFilm.book_author || ''}
                              onChange={e => setEditingFilm({ ...editingFilm, book_author: e.target.value })}
                              placeholder="e.g., Jim Thomas & John Thomas"
                              className="bg-slate-800 border-slate-700"
                            />
                            <p className="text-xs text-muted-foreground">Use " & " to separate multiple writers</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">Script URL</Label>
                            <Input
                              value={editingFilm.script_url || ''}
                              onChange={e => setEditingFilm({ ...editingFilm, script_url: e.target.value })}
                              placeholder="https://assets.scriptslug.com/..."
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-300">Script Source</Label>
                            <select
                              value={editingFilm.script_source || ''}
                              onChange={e => setEditingFilm({ ...editingFilm, script_source: e.target.value || null })}
                              className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-md text-sm"
                            >
                              <option value="">Not specified</option>
                              <option value="scriptslug">ScriptSlug</option>
                              <option value="imsdb">IMSDb</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">Screenplay Cover URL</Label>
                            <Input
                              value={editingFilm.book_cover_url || ''}
                              onChange={e => setEditingFilm({ ...editingFilm, book_cover_url: e.target.value })}
                              placeholder="ScriptSlug poster URL"
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
        <CardDescription className="text-amber-200/70">
          Manage SF film adaptations with posters, trailers, and streaming links
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-slate-800/50 p-2 rounded">
            <div className="text-lg font-bold text-amber-400">{stats.total}</div>
            <div className="text-slate-400">Total</div>
          </div>
          <div className="bg-slate-800/50 p-2 rounded">
            <div className="text-lg font-bold text-green-400">{stats.withPosters}</div>
            <div className="text-slate-400">Posters</div>
          </div>
          <div className="bg-slate-800/50 p-2 rounded">
            <div className="text-lg font-bold text-blue-400">{stats.withBookCovers}</div>
            <div className="text-slate-400">Covers</div>
          </div>
          <div className="bg-slate-800/50 p-2 rounded">
            <div className="text-lg font-bold text-purple-400">{stats.withTrailers}</div>
            <div className="text-slate-400">Trailers</div>
          </div>
          <div className="bg-slate-800/50 p-2 rounded">
            <div className="text-lg font-bold text-cyan-400">{stats.withScripts}</div>
            <div className="text-slate-400">Scripts</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handlePopulate} disabled={isPopulating}>
            {isPopulating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            Populate Films
          </Button>
          <Button size="sm" variant="outline" onClick={handleEnrichArtwork} disabled={isEnrichingArtwork}>
            {isEnrichingArtwork ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Image className="w-4 h-4 mr-1" />}
            Artwork
          </Button>
          <Button size="sm" variant="outline" onClick={handleEnrichTrailers} disabled={isEnrichingTrailers}>
            {isEnrichingTrailers ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            Trailers
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search films..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700"
          />
        </div>

        {/* Films Table - Scrollable with proper title handling */}
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted-foreground/30 rounded-lg border border-border/30">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-900 z-10">
              <TableRow>
                <TableHead className="w-[200px]">Film</TableHead>
                <TableHead className="w-[200px]">Book</TableHead>
                <TableHead className="w-[60px]">Year</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFilms.slice(0, 100).map(film => (
                <TableRow key={film.id} className="hover:bg-muted/20">
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-12 flex-shrink-0 bg-muted/30 rounded overflow-hidden">
                        {film.poster_url ? (
                          <img src={film.poster_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate max-w-[150px]" title={film.film_title}>
                          {film.film_title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={film.director || ''}>
                          {film.director || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="min-w-0">
                      <p className="text-sm truncate max-w-[180px]" title={film.book_title}>
                        {film.book_title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={film.book_author}>
                        {film.book_author}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-sm">{film.film_year}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex gap-1 flex-wrap">
                      {film.poster_url && <Badge variant="outline" className="text-[10px] px-1">Poster</Badge>}
                      {film.trailer_url && <Badge variant="outline" className="text-[10px] px-1">Trailer</Badge>}
                      {film.is_criterion_collection && <Badge className="text-[10px] px-1 bg-yellow-600">CC</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingFilm(film); setIsDialogOpen(true); }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => handleDelete(film.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredFilms.length > 100 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Showing 100 of {filteredFilms.length} films. Use search to filter.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
