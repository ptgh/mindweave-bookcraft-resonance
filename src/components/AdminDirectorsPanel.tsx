import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { invokeAdminFunction } from "@/utils/adminFunctions";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Video, 
  User,
  ExternalLink,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  Loader2
} from "lucide-react";

interface Director {
  id: string;
  name: string;
  nationality: string | null;
  bio: string | null;
  birth_year: number | null;
  death_year: number | null;
  wikipedia_url: string | null;
  photo_url: string | null;
  notable_sf_films: string[] | null;
  created_at: string;
  updated_at: string;
}

interface DirectorFormData {
  name: string;
  nationality: string;
  bio: string;
  birth_year: string;
  death_year: string;
  wikipedia_url: string;
  photo_url: string;
  notable_sf_films: string;
}

const emptyFormData: DirectorFormData = {
  name: "",
  nationality: "",
  bio: "",
  birth_year: "",
  death_year: "",
  wikipedia_url: "",
  photo_url: "",
  notable_sf_films: "",
};

export const AdminDirectorsPanel = () => {
  const { toast } = useEnhancedToast();
  const [directors, setDirectors] = useState<Director[]>([]);
  const [filteredDirectors, setFilteredDirectors] = useState<Director[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDirector, setEditingDirector] = useState<Director | null>(null);
  const [formData, setFormData] = useState<DirectorFormData>(emptyFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnrichingAll, setIsEnrichingAll] = useState(false);

  // Statistics
  const stats = {
    total: directors.length,
    withPhotos: directors.filter(d => d.photo_url).length,
    withBios: directors.filter(d => d.bio).length,
    withWikipedia: directors.filter(d => d.wikipedia_url).length,
    withFilms: directors.filter(d => d.notable_sf_films && d.notable_sf_films.length > 0).length,
  };

  useEffect(() => {
    fetchDirectors();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDirectors(directors);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredDirectors(
        directors.filter(
          d =>
            d.name.toLowerCase().includes(query) ||
            d.nationality?.toLowerCase().includes(query) ||
            d.notable_sf_films?.some(f => f.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, directors]);

  const fetchDirectors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("sf_directors")
        .select("*")
        .order("name");

      if (error) throw error;
      setDirectors(data || []);
      setFilteredDirectors(data || []);
    } catch (error) {
      console.error("Error fetching directors:", error);
      toast({
        title: "Error",
        description: "Failed to load directors",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (director?: Director) => {
    if (director) {
      setEditingDirector(director);
      setFormData({
        name: director.name,
        nationality: director.nationality || "",
        bio: director.bio || "",
        birth_year: director.birth_year?.toString() || "",
        death_year: director.death_year?.toString() || "",
        wikipedia_url: director.wikipedia_url || "",
        photo_url: director.photo_url || "",
        notable_sf_films: director.notable_sf_films?.join(", ") || "",
      });
    } else {
      setEditingDirector(null);
      setFormData(emptyFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Director name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const directorData = {
        name: formData.name.trim(),
        nationality: formData.nationality.trim() || null,
        bio: formData.bio.trim() || null,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
        death_year: formData.death_year ? parseInt(formData.death_year) : null,
        wikipedia_url: formData.wikipedia_url.trim() || null,
        photo_url: formData.photo_url.trim() || null,
        notable_sf_films: formData.notable_sf_films
          ? formData.notable_sf_films.split(",").map(f => f.trim()).filter(Boolean)
          : [],
      };

      if (editingDirector) {
        const { error } = await supabase
          .from("sf_directors")
          .update(directorData)
          .eq("id", editingDirector.id);

        if (error) throw error;
        toast({
          title: "Director Updated",
          description: `Successfully updated ${directorData.name}`,
          variant: "success",
        });
      } else {
        const { error } = await supabase
          .from("sf_directors")
          .insert([directorData]);

        if (error) throw error;
        toast({
          title: "Director Added",
          description: `Successfully added ${directorData.name}`,
          variant: "success",
        });
      }

      setIsDialogOpen(false);
      fetchDirectors();
    } catch (error) {
      console.error("Error saving director:", error);
      toast({
        title: "Error",
        description: "Failed to save director",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (director: Director) => {
    if (!confirm(`Are you sure you want to delete ${director.name}?`)) return;

    try {
      const { error } = await supabase
        .from("sf_directors")
        .delete()
        .eq("id", director.id);

      if (error) throw error;
      toast({
        title: "Director Deleted",
        description: `Successfully deleted ${director.name}`,
        variant: "success",
      });
      fetchDirectors();
    } catch (error) {
      console.error("Error deleting director:", error);
      toast({
        title: "Error",
        description: "Failed to delete director",
        variant: "destructive",
      });
    }
  };

  const handlePopulateDirectors = async () => {
    try {
      toast({
        title: "Populating Directors",
        description: "Running populate-sf-directors function...",
      });

      const { data, error } = await invokeAdminFunction("populate-sf-directors");

      if (error) throw error;

      toast({
        title: "Directors Populated",
        description: `Successfully populated ${(data as any).count || 0} directors`,
        variant: "success",
      });
      fetchDirectors();
    } catch (error: any) {
      console.error("Error populating directors:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to populate directors",
        variant: "destructive",
      });
    }
  };

  const handleEnrichAllDirectors = async () => {
    setIsEnrichingAll(true);
    const directorsNeedingEnrichment = directors.filter(d => !d.bio || !d.photo_url);
    
    toast({
      title: "Starting Batch Enrichment",
      description: `Enriching ${directorsNeedingEnrichment.length} directors from Wikipedia...`,
    });

    let enrichedCount = 0;
    let errorCount = 0;

    for (const director of directorsNeedingEnrichment) {
      try {
        const { data, error } = await invokeAdminFunction("enrich-director-data", {
          directorName: director.name,
          directorId: director.id
        });

        if (error) throw error;
        
        if ((data as any).success) {
          enrichedCount++;
          console.log(`✓ Enriched: ${director.name}`);
        }
      } catch (error) {
        console.error(`Error enriching ${director.name}:`, error);
        errorCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    toast({
      title: "Batch Enrichment Complete",
      description: `Enriched ${enrichedCount} directors, ${errorCount} errors`,
      variant: enrichedCount > 0 ? "success" : "destructive",
    });
    
    setIsEnrichingAll(false);
    fetchDirectors();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            <CardTitle>SF Directors Management</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnrichAllDirectors}
              disabled={isEnrichingAll}
              className="border-purple-500/30 text-purple-300"
            >
              {isEnrichingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Enrich All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePopulateDirectors}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Populate Directors
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Director
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingDirector ? "Edit Director" : "Add New Director"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDirector
                      ? "Update the director's information"
                      : "Add a new SF director to the database"}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Christopher Nolan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) =>
                          setFormData({ ...formData, nationality: e.target.value })
                        }
                        placeholder="British-American"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birth_year">Birth Year</Label>
                      <Input
                        id="birth_year"
                        type="number"
                        value={formData.birth_year}
                        onChange={(e) =>
                          setFormData({ ...formData, birth_year: e.target.value })
                        }
                        placeholder="1970"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="death_year">Death Year</Label>
                      <Input
                        id="death_year"
                        type="number"
                        value={formData.death_year}
                        onChange={(e) =>
                          setFormData({ ...formData, death_year: e.target.value })
                        }
                        placeholder="Leave empty if alive"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biography</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Brief biography of the director..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notable_sf_films">Notable SF Films (comma-separated)</Label>
                    <Input
                      id="notable_sf_films"
                      value={formData.notable_sf_films}
                      onChange={(e) =>
                        setFormData({ ...formData, notable_sf_films: e.target.value })
                      }
                      placeholder="Inception, Interstellar, Tenet"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wikipedia_url">Wikipedia URL</Label>
                    <Input
                      id="wikipedia_url"
                      value={formData.wikipedia_url}
                      onChange={(e) =>
                        setFormData({ ...formData, wikipedia_url: e.target.value })
                      }
                      placeholder="https://en.wikipedia.org/wiki/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo_url">Photo URL</Label>
                    <Input
                      id="photo_url"
                      value={formData.photo_url}
                      onChange={(e) =>
                        setFormData({ ...formData, photo_url: e.target.value })
                      }
                      placeholder="https://..."
                    />
                    {formData.photo_url && (
                      <div className="mt-2">
                        <img
                          src={formData.photo_url}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-full border border-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? "Saving..." : editingDirector ? "Update" : "Add"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <CardDescription>
          Manage SF film directors with photos, bios, and filmographies
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Directors</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.withPhotos}</div>
            <div className="text-xs text-muted-foreground">With Photos</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.withBios}</div>
            <div className="text-xs text-muted-foreground">With Bios</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.withWikipedia}</div>
            <div className="text-xs text-muted-foreground">Wikipedia</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.withFilms}</div>
            <div className="text-xs text-muted-foreground">With Films</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search directors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Directors Table */}
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Director</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Years</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDirectors.slice(0, 50).map((director) => (
                <TableRow key={director.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {director.photo_url ? (
                        <img
                          src={director.photo_url}
                          alt={director.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <span className="font-medium">{director.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{director.nationality || "-"}</TableCell>
                  <TableCell>
                    {director.birth_year}
                    {director.death_year ? ` - ${director.death_year}` : ""}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {director.bio && <Badge variant="outline" className="text-[10px]">Bio</Badge>}
                      {director.photo_url && <Badge variant="outline" className="text-[10px]">Photo</Badge>}
                      {director.wikipedia_url && <Badge variant="outline" className="text-[10px]">Wiki</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(director)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(director)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
