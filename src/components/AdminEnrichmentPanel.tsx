import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { 
  getEnrichmentStats, 
  bulkProcessAllPending 
} from "@/services/authorEnrichmentService";
import { 
  getMissingCoverStats, 
  enrichBookCovers 
} from "@/services/bookCoverEnrichmentService";
import { 
  getMissingBookDataStats,
  enrichFilmAdaptationBooks
} from "@/services/filmAdaptationEnrichmentService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  PlayCircle, RefreshCw, CheckCircle, XCircle, Clock, Image, Film, 
  Calendar, Database, Users, FileText, Clapperboard, ChevronDown, ChevronRight, BookOpen 
} from "lucide-react";
import { invokeAdminFunction } from "@/utils/adminFunctions";
import { AdminCoverHealthPanel } from "@/components/admin/AdminCoverHealthPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const AdminEnrichmentPanel = () => {
  const { toast } = useEnhancedToast();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  // Section expansion state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    authors: true,
    authorBooks: false,
    covers: true,
    films: true,
    scripts: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: ['enrichment-stats'],
    queryFn: getEnrichmentStats,
    refetchInterval: 5000,
  });

  const { data: coverStats } = useQuery({
    queryKey: ['cover-stats'],
    queryFn: getMissingCoverStats,
    refetchInterval: 10000,
  });

  const { data: filmBookStats } = useQuery({
    queryKey: ['film-book-stats'],
    queryFn: getMissingBookDataStats,
    refetchInterval: 10000,
  });

  const bulkProcessMutation = useMutation({
    mutationFn: async () => {
      return await bulkProcessAllPending((current, total) => {
        setProgress({ current, total });
      });
    },
    onSuccess: (result) => {
      toast({
        title: "Author Enrichment Complete",
        description: `Processed ${result.processed} authors. ${result.successful} successful, ${result.failed} failed.`,
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ['enrichment-stats'] });
      setProgress({ current: 0, total: 0 });
    },
    onError: (error: Error) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
      setProgress({ current: 0, total: 0 });
    },
  });

  const coverEnrichmentMutation = useMutation({
    mutationFn: async () => {
      return await enrichBookCovers((current, total) => {
        setProgress({ current, total });
      });
    },
    onSuccess: (result) => {
      toast({
        title: "Cover Enrichment Complete",
        description: `Processed ${result.processed} books. ${result.successful} covers added, ${result.failed} failed.`,
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ['cover-stats'] });
      setProgress({ current: 0, total: 0 });
    },
    onError: (error: Error) => {
      toast({
        title: "Cover Enrichment Failed",
        description: error.message,
        variant: "destructive",
      });
      setProgress({ current: 0, total: 0 });
    },
  });

  const filmBookEnrichmentMutation = useMutation({
    mutationFn: async () => {
      return await enrichFilmAdaptationBooks((current, total) => {
        setProgress({ current, total });
      });
    },
    onSuccess: (result) => {
      toast({
        title: "Film Book Enrichment Complete",
        description: `Processed ${result.processed} films. ${result.successful} updated, ${result.failed} unchanged.`,
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ['film-book-stats'] });
      setProgress({ current: 0, total: 0 });
    },
    onError: (error: Error) => {
      toast({
        title: "Film Book Enrichment Failed",
        description: error.message,
        variant: "destructive",
      });
      setProgress({ current: 0, total: 0 });
    },
  });

  const populateVerifiedFilmsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeAdminFunction('populate-verified-sf-films');
      if (error) throw error;
      return data;
    },
    onSuccess: (result: any) => {
      toast({
        title: "Verified Films Populated",
        description: `Added ${result.added} new films. ${result.enriched} enriched with book data. ${result.alreadyExist} already existed.`,
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ['film-book-stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Population Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const screenplayEnrichmentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeAdminFunction('enrich-screenplay-data');
      if (error) throw error;
      return data;
    },
    onSuccess: (result: any) => {
      toast({
        title: "Screenplay Enrichment Complete",
        description: `Processed ${result.processed || 0} films. ${result.enriched || 0} screenplays updated.`,
        variant: "success"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Screenplay Enrichment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const populateAuthorBooksMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeAdminFunction('populate-author-books', {
        fillEmpty: true,
        booksPerAuthor: 8,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (result: any) => {
      toast({
        title: "Author Books Populated",
        description: `Processed ${result.processed || 0} authors. ${result.booksAdded || 0} books added, ${result.skipped || 0} skipped.`,
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ['enrichment-stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Author Books Population Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const progressPercentage = progress.total > 0 
    ? (progress.current / progress.total) * 100 
    : 0;

  const isAnyMutationPending = 
    bulkProcessMutation.isPending || 
    coverEnrichmentMutation.isPending || 
    filmBookEnrichmentMutation.isPending ||
    populateVerifiedFilmsMutation.isPending ||
    screenplayEnrichmentMutation.isPending ||
    populateAuthorBooksMutation.isPending;

  if (isLoading) {
    return (
      <Card className="p-6 bg-background/40 backdrop-blur-md border-border/50">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Global Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 bg-background/40 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-foreground">{stats?.pendingJobs || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-background/40 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-xs text-muted-foreground">Complete</p>
              <p className="text-lg font-bold text-foreground">{stats?.completeAuthors || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-background/40 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-xs text-muted-foreground">Need Work</p>
              <p className="text-lg font-bold text-foreground">{stats?.authorsNeedingEnrichment || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-background/40 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">Quality</p>
              <p className="text-lg font-bold text-foreground">{stats?.avgQuality || 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Bar (shown when any mutation is pending) */}
      {isAnyMutationPending && progress.total > 0 && (
        <Card className="p-4 bg-background/40 backdrop-blur-md border-primary/30">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Processing...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </Card>
      )}

      {/* Section 1: Authors */}
      <Collapsible open={expandedSections.authors} onOpenChange={() => toggleSection('authors')}>
        <Card className="bg-background/40 backdrop-blur-md border-emerald-400/30 overflow-hidden">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-foreground">Author Enrichment</h3>
              <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                {stats?.pendingJobs || 0} pending
              </span>
            </div>
            {expandedSections.authors ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
              <p className="text-sm text-muted-foreground">
                Fetch bios, birth/death years, and Wikipedia data for authors missing information.
              </p>
              <Button
                onClick={() => bulkProcessMutation.mutate()}
                disabled={bulkProcessMutation.isPending || (stats?.pendingJobs || 0) === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {bulkProcessMutation.isPending ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><PlayCircle className="h-4 w-4 mr-2" /> Enrich Authors ({stats?.pendingJobs || 0})</>
                )}
              </Button>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 1b: Author Books Population */}
      <Collapsible open={expandedSections.authorBooks} onOpenChange={() => toggleSection('authorBooks')}>
        <Card className="bg-background/40 backdrop-blur-md border-purple-400/30 overflow-hidden">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-purple-400" />
              <h3 className="text-base font-semibold text-foreground">Author Books</h3>
              <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                Populate from Google Books
              </span>
            </div>
            {expandedSections.authorBooks ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
              <p className="text-sm text-muted-foreground">
                Fetch books from Google Books API for all authors with no books in the database. Filters for SF-relevant titles only.
              </p>
              <Button
                onClick={() => populateAuthorBooksMutation.mutate()}
                disabled={populateAuthorBooksMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {populateAuthorBooksMutation.isPending ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Populating...</>
                ) : (
                  <><BookOpen className="h-4 w-4 mr-2" /> Populate All Empty Authors</>
                )}
              </Button>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={expandedSections.covers} onOpenChange={() => toggleSection('covers')}>
        <Card className="bg-background/40 backdrop-blur-md border-blue-400/30 overflow-hidden">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-blue-400" />
              <h3 className="text-base font-semibold text-foreground">Book Covers</h3>
              <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                {coverStats?.missingCovers || 0} missing
              </span>
            </div>
            {expandedSections.covers ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
              <p className="text-sm text-muted-foreground">
                Fetch missing book covers from Google Books API for publisher books.
              </p>
              <Button
                onClick={() => coverEnrichmentMutation.mutate()}
                disabled={coverEnrichmentMutation.isPending || (coverStats?.missingCovers || 0) === 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {coverEnrichmentMutation.isPending ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Fetching...</>
                ) : (
                  <><Image className="h-4 w-4 mr-2" /> Fetch Covers ({coverStats?.missingCovers || 0})</>
                )}
              </Button>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 3: Film Data */}
      <Collapsible open={expandedSections.films} onOpenChange={() => toggleSection('films')}>
        <Card className="bg-background/40 backdrop-blur-md border-amber-400/30 overflow-hidden">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3">
              <Clapperboard className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-semibold text-foreground">Film Data</h3>
              <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                {filmBookStats?.totalFilms || 0} films
              </span>
            </div>
            {expandedSections.films ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-3">
              {/* Film Book Data */}
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Image className="h-3 w-3 text-amber-400" /> {filmBookStats?.missingCovers || 0} covers</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-cyan-400" /> {filmBookStats?.missingYears || 0} years</span>
                </div>
                <Button
                  onClick={() => filmBookEnrichmentMutation.mutate()}
                  disabled={filmBookEnrichmentMutation.isPending || ((filmBookStats?.missingCovers || 0) === 0 && (filmBookStats?.missingYears || 0) === 0)}
                  variant="outline"
                  className="w-full border-amber-400/30 hover:bg-amber-400/10"
                >
                  {filmBookEnrichmentMutation.isPending ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Enriching...</>
                  ) : (
                    <><Film className="h-4 w-4 mr-2" /> Enrich Book Data</>
                  )}
                </Button>
              </div>
              
              {/* Populate Verified Films */}
              <div className="space-y-2 pt-2 border-t border-border/20">
              <p className="text-xs text-muted-foreground">
                  Add verified SF films to the database
                </p>
                <Button
                  onClick={() => populateVerifiedFilmsMutation.mutate()}
                  disabled={populateVerifiedFilmsMutation.isPending}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {populateVerifiedFilmsMutation.isPending ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Populating...</>
                  ) : (
                    <><Database className="h-4 w-4 mr-2" /> Populate Verified Films</>
                  )}
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 5: Cover Health Dashboard */}
      <AdminCoverHealthPanel />

      {/* Section 6: Scripts */}
      <Collapsible open={expandedSections.scripts} onOpenChange={() => toggleSection('scripts')}>
        <Card className="bg-background/40 backdrop-blur-md border-cyan-400/30 overflow-hidden">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-semibold text-foreground">Screenplay Data</h3>
            </div>
            {expandedSections.scripts ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
              <p className="text-sm text-muted-foreground">
                Fetch screenwriter names and script URLs from ScriptSlug, TMDB, and IMSDb for films missing screenplay data.
              </p>
              <Button
                onClick={() => screenplayEnrichmentMutation.mutate()}
                disabled={screenplayEnrichmentMutation.isPending}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {screenplayEnrichmentMutation.isPending ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Enriching...</>
                ) : (
                  <><FileText className="h-4 w-4 mr-2" /> Enrich Screenplay Data</>
                )}
              </Button>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Info Card */}
      <Card className="p-4 bg-background/20 backdrop-blur-md border-border/30">
        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Automatic Scheduling</p>
            <p className="text-xs text-muted-foreground">
              Author enrichment runs automatically every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
