import { AdminEnrichmentPanel } from "@/components/AdminEnrichmentPanel";
import { AdminPopulateBooks } from "@/components/AdminPopulateBooks";
import { AdminFilmAdaptationsPanel } from "@/components/AdminFilmAdaptationsPanel";
import { AdminDirectorsPanel } from "@/components/AdminDirectorsPanel";
import { AdminImageUrlValidator } from "@/components/AdminImageUrlValidator";
import { AdminBooksPanel, AdminTrailersPanel, AdminExternalLinksPanel, AdminCachePanel } from "@/components/admin";
import Header from "@/components/Header";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { generateTransmissionEmbeddings } from "@/services/semanticSearchService";
import { invokeAdminFunction } from "@/utils/adminFunctions";
import { 
  RefreshCw, Clock, Sparkles, ShieldCheck, Book, Film, Users, HardDrive, 
  Tags, Database, Image, Play, Link2, FileText, Activity, CheckCircle,
  BookOpen, Tv, AlertTriangle, Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface MasterStats {
  films: {
    total: number;
    missingPosters: number;
    missingTrailers: number;
    missingBookCovers: number;
    missingScripts: number;
    missingWatchProviders: number;
  };
  books: {
    total: number;
    withCovers: number;
    missingCovers: number;
  };
  authors: {
    total: number;
    complete: number;
    pending: number;
  };
  directors: {
    total: number;
    withBios: number;
    withPhotos: number;
  };
}

const AdminEnrichment = () => {
  const { toast: enhancedToast } = useEnhancedToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMasterEnriching, setIsMasterEnriching] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [masterStats, setMasterStats] = useState<MasterStats | null>(null);
  const [enrichmentProgress, setEnrichmentProgress] = useState<{ step: string; current: number; total: number } | null>(null);

  // Fetch all stats on mount
  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    setIsLoadingStats(true);
    try {
      // Fetch film stats
      const { data: films } = await supabase
        .from('sf_film_adaptations')
        .select('id, poster_url, trailer_url, book_cover_url, script_url, watch_providers, adaptation_type');

      // Fetch book stats (transmissions)
      const { data: books } = await supabase
        .from('transmissions')
        .select('id, cover_url');

      // Fetch author stats
      const { data: authors } = await supabase
        .from('scifi_authors')
        .select('id, bio, birth_year');

      // Fetch director stats
      const { data: directors } = await supabase
        .from('sf_directors')
        .select('id, bio, photo_url');

      setMasterStats({
        films: {
          total: films?.length || 0,
          missingPosters: films?.filter(f => !f.poster_url).length || 0,
          missingTrailers: films?.filter(f => !f.trailer_url).length || 0,
          missingBookCovers: films?.filter(f => f.adaptation_type !== 'original' && !f.book_cover_url).length || 0,
          missingScripts: films?.filter(f => !f.script_url).length || 0,
          missingWatchProviders: films?.filter(f => !f.watch_providers || Object.keys(f.watch_providers).length === 0).length || 0,
        },
        books: {
          total: books?.length || 0,
          withCovers: books?.filter(b => b.cover_url).length || 0,
          missingCovers: books?.filter(b => !b.cover_url).length || 0,
        },
        authors: {
          total: authors?.length || 0,
          complete: authors?.filter(a => a.bio && a.birth_year).length || 0,
          pending: authors?.filter(a => !a.bio || !a.birth_year).length || 0,
        },
        directors: {
          total: directors?.length || 0,
          withBios: directors?.filter(d => d.bio).length || 0,
          withPhotos: directors?.filter(d => d.photo_url).length || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const runMasterEnrichment = async () => {
    setIsMasterEnriching(true);
    const steps = [
      { name: 'Film Artwork', func: 'enrich-film-artwork' },
      { name: 'Trailers', func: 'enrich-trailer-urls' },
      { name: 'Book Matching', func: 'match-film-books' },
      { name: 'Book Covers', func: 'enrich-film-book-covers' },
      { name: 'Criterion Links', func: 'enrich-criterion-links' },
      { name: 'Scripts', func: 'enrich-imsdb-scripts' },
    ];

    toast.info('Starting Master Enrichment (6 jobs)...');

    let successCount = 0;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setEnrichmentProgress({ step: step.name, current: i + 1, total: steps.length });
      
      try {
        const { error } = await supabase.functions.invoke(step.func);
        if (!error) {
          successCount++;
          console.log(`✓ ${step.name} completed`);
        } else {
          console.error(`✗ ${step.name} failed:`, error);
        }
      } catch (error) {
        console.error(`✗ ${step.name} error:`, error);
      }
      
      // Brief pause between jobs
      if (i < steps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setEnrichmentProgress(null);
    setIsMasterEnriching(false);
    toast.success(`Master Enrichment Complete: ${successCount}/${steps.length} jobs succeeded`);
    fetchAllStats();
  };

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              Data Enrichment Administration
            </h1>
            <p className="text-muted-foreground text-sm">
              Central hub for managing, enriching, and validating all data
            </p>
          </div>

          {/* Master Enrichment Card */}
          <Card className="mb-6 border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 to-cyan-950/30">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-lg font-semibold text-emerald-100">Master Enrichment</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Run all enrichment jobs sequentially: artwork, trailers, book matching, covers, Criterion links, and scripts.
                  </p>
                  {enrichmentProgress && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-emerald-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Step {enrichmentProgress.current}/{enrichmentProgress.total}: {enrichmentProgress.step}</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={runMasterEnrichment}
                  disabled={isMasterEnriching}
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-lg"
                >
                  {isMasterEnriching ? (
                    <><RefreshCw className="h-5 w-5 mr-2 animate-spin" /> Running...</>
                  ) : (
                    <><Sparkles className="h-5 w-5 mr-2" /> Enrich All Data</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="p-3 bg-amber-950/20 border-amber-500/30">
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-foreground">{masterStats?.films.total || 0}</p>
                  <p className="text-xs text-muted-foreground truncate">Films</p>
                </div>
              </div>
              {masterStats && masterStats.films.missingPosters > 0 && (
                <Badge variant="outline" className="mt-1 text-[10px] border-amber-500/30 text-amber-400">
                  {masterStats.films.missingPosters} missing posters
                </Badge>
              )}
            </Card>

            <Card className="p-3 bg-emerald-950/20 border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Book className="h-5 w-5 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-foreground">{masterStats?.books.total || 0}</p>
                  <p className="text-xs text-muted-foreground truncate">Books</p>
                </div>
              </div>
              {masterStats && masterStats.books.missingCovers > 0 && (
                <Badge variant="outline" className="mt-1 text-[10px] border-emerald-500/30 text-emerald-400">
                  {masterStats.books.missingCovers} missing covers
                </Badge>
              )}
            </Card>

            <Card className="p-3 bg-cyan-950/20 border-cyan-500/30">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-foreground">{masterStats?.authors.total || 0}</p>
                  <p className="text-xs text-muted-foreground truncate">Authors</p>
                </div>
              </div>
              {masterStats && masterStats.authors.pending > 0 && (
                <Badge variant="outline" className="mt-1 text-[10px] border-cyan-500/30 text-cyan-400">
                  {masterStats.authors.pending} pending
                </Badge>
              )}
            </Card>

            <Card className="p-3 bg-purple-950/20 border-purple-500/30">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-foreground">{masterStats?.directors.total || 0}</p>
                  <p className="text-xs text-muted-foreground truncate">Directors</p>
                </div>
              </div>
              {masterStats && masterStats.directors.total - masterStats.directors.withBios > 0 && (
                <Badge variant="outline" className="mt-1 text-[10px] border-purple-500/30 text-purple-400">
                  {masterStats.directors.total - masterStats.directors.withBios} need bios
                </Badge>
              )}
            </Card>
          </div>

          {/* Tabbed Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/30">
              <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">
                <Database className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="films" className="text-xs sm:text-sm py-2">
                <Film className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Films</span>
                <span className="sm:hidden">Films</span>
              </TabsTrigger>
              <TabsTrigger value="books" className="text-xs sm:text-sm py-2">
                <Book className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Books</span>
                <span className="sm:hidden">Books</span>
              </TabsTrigger>
              <TabsTrigger value="people" className="text-xs sm:text-sm py-2">
                <Users className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">People</span>
                <span className="sm:hidden">People</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="text-xs sm:text-sm py-2">
                <HardDrive className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">System</span>
                <span className="sm:hidden">Cache</span>
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-4">
              {/* Film Data Health */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Film className="h-4 w-4 text-amber-400" />
                    Film Data Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    <StatBox icon={<Image className="h-4 w-4" />} label="Posters" 
                      value={masterStats?.films.total ? masterStats.films.total - masterStats.films.missingPosters : 0}
                      total={masterStats?.films.total || 0} color="amber" />
                    <StatBox icon={<Play className="h-4 w-4" />} label="Trailers" 
                      value={masterStats?.films.total ? masterStats.films.total - masterStats.films.missingTrailers : 0}
                      total={masterStats?.films.total || 0} color="red" />
                    <StatBox icon={<BookOpen className="h-4 w-4" />} label="Book Covers" 
                      value={masterStats?.films.total ? masterStats.films.total - masterStats.films.missingBookCovers : 0}
                      total={masterStats?.films.total || 0} color="emerald" />
                    <StatBox icon={<FileText className="h-4 w-4" />} label="Scripts" 
                      value={masterStats?.films.total ? masterStats.films.total - masterStats.films.missingScripts : 0}
                      total={masterStats?.films.total || 0} color="cyan" />
                    <StatBox icon={<Tv className="h-4 w-4" />} label="Streaming" 
                      value={masterStats?.films.total ? masterStats.films.total - masterStats.films.missingWatchProviders : 0}
                      total={masterStats?.films.total || 0} color="purple" />
                    <StatBox icon={<Link2 className="h-4 w-4" />} label="Links" 
                      value={masterStats?.films.total || 0}
                      total={masterStats?.films.total || 0} color="blue" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Enrichment Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    Quick Enrichment Actions
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Non-destructive operations (INSERT/UPDATE only)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <EnrichButton label="Artwork" icon={<Image className="h-4 w-4" />} func="enrich-film-artwork" />
                    <EnrichButton label="Trailers" icon={<Play className="h-4 w-4" />} func="enrich-trailer-urls" />
                    <EnrichButton label="Match Books" icon={<Link2 className="h-4 w-4" />} func="match-film-books" />
                    <EnrichButton label="Book Covers" icon={<BookOpen className="h-4 w-4" />} func="enrich-film-book-covers" />
                    <EnrichButton label="Criterion" icon={<CheckCircle className="h-4 w-4" />} func="enrich-criterion-links" />
                    <EnrichButton label="Scripts" icon={<FileText className="h-4 w-4" />} func="enrich-imsdb-scripts" />
                    <EnrichButton label="Watch Providers" icon={<Tv className="h-4 w-4" />} func="cache-watch-providers" />
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-200">
                        <strong>No Destructive Queries Policy:</strong> All enrichment operations use INSERT or UPDATE only. 
                        DELETE and TRUNCATE are prohibited.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Enrichment Panel */}
              <AdminEnrichmentPanel />
            </TabsContent>

            {/* FILMS TAB */}
            <TabsContent value="films" className="space-y-4">
              <AdminFilmAdaptationsPanel />
              <div className="grid md:grid-cols-2 gap-4">
                <AdminTrailersPanel />
                <AdminExternalLinksPanel />
              </div>
            </TabsContent>

            {/* BOOKS TAB */}
            <TabsContent value="books" className="space-y-4">
              <AdminBooksPanel />
              <AdminPopulateBooks />
              <AdminImageUrlValidator />
            </TabsContent>

            {/* PEOPLE TAB */}
            <TabsContent value="people" className="space-y-4">
              <AdminDirectorsPanel />
            </TabsContent>

            {/* SYSTEM TAB */}
            <TabsContent value="system" className="space-y-4">
              <AdminCachePanel />
              
              {/* System Info */}
              <Card className="border-slate-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-foreground mb-2">AI Enrichment</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                        <li>OpenAI tool calling with 95 controlled vocabulary tags</li>
                        <li>Rate limited: 1 request/second</li>
                        <li>text-embedding-3-small for semantic search</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-2">Automatic Scheduling</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                        <li>Enrichment jobs run every 6 hours</li>
                        <li>Times: 00:00, 06:00, 12:00, 18:00 UTC</li>
                      </ul>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const { data, error } = await invokeAdminFunction<{ ok: boolean; userId: string | null; mode: string }>("admin-whoami");
                        if (error) {
                          toast.error(`Auth Test Failed: ${error.message}`);
                        } else {
                          toast.success(`Auth OK: ${data?.mode} | ${data?.userId?.slice(0, 8) || 'internal'}...`);
                        }
                      }}
                      className="border-green-500/30 text-green-400"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Test Auth
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        toast.info('Generating embeddings...');
                        try {
                          const result = await generateTransmissionEmbeddings(100);
                          toast.success(`Created ${result.processed} embeddings, ${result.skipped} skipped`);
                        } catch (e) {
                          toast.error('Embedding generation failed');
                        }
                      }}
                      className="border-blue-500/30 text-blue-400"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Embeddings
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        toast.info('AI Tag Enrichment starting...');
                        try {
                          const { data, error } = await supabase.functions.invoke('enrich-transmission-tags', {
                            body: { limit: 50, minConfidence: 60 }
                          });
                          if (error) throw error;
                          toast.success(`Enriched ${data.results?.enriched || 0}/${data.results?.processed || 0} transmissions`);
                        } catch (e) {
                          toast.error('Tag enrichment failed');
                        }
                      }}
                      className="border-cyan-500/30 text-cyan-400"
                    >
                      <Tags className="w-4 h-4 mr-2" />
                      AI Tag Enrichment
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        toast.info('Running temporal enrichment...');
                        try {
                          const { data, error } = await supabase.functions.invoke('enrich-timeline-data');
                          if (error) throw error;
                          toast.success(`Enriched ${data.enriched?.length || 0} books with temporal data`);
                        } catch (e) {
                          toast.error('Temporal enrichment failed');
                        }
                      }}
                      className="border-purple-500/30 text-purple-400"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Temporal Enrichment
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAllStats}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh All Stats
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedAdminRoute>
  );
};

// Helper Components
const StatBox = ({ icon, label, value, total, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  total: number;
  color: string;
}) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const colorClasses: Record<string, string> = {
    amber: 'text-amber-400',
    red: 'text-red-400',
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
  };
  
  return (
    <div className="text-center p-2 bg-muted/20 rounded-lg">
      <div className={`flex justify-center mb-1 ${colorClasses[color] || 'text-muted-foreground'}`}>
        {icon}
      </div>
      <p className="text-lg font-bold text-foreground">{value}<span className="text-xs text-muted-foreground">/{total}</span></p>
      <p className="text-[10px] text-muted-foreground truncate">{label}</p>
      <div className="mt-1 h-1 bg-muted/30 rounded-full overflow-hidden">
        <div 
          className={`h-full ${percentage === 100 ? 'bg-emerald-500' : percentage > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const EnrichButton = ({ label, icon, func }: { label: string; icon: React.ReactNode; func: string }) => {
  const [isRunning, setIsRunning] = useState(false);
  
  const handleClick = async () => {
    setIsRunning(true);
    try {
      toast.info(`Starting ${label}...`);
      const { error } = await supabase.functions.invoke(func);
      if (error) throw error;
      toast.success(`${label} completed`);
    } catch (e) {
      toast.error(`${label} failed`);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isRunning}
      className="text-xs"
    >
      {isRunning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : icon}
      <span className="ml-1">{label}</span>
    </Button>
  );
};

export default AdminEnrichment;
