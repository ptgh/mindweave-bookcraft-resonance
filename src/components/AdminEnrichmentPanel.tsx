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
import { PlayCircle, RefreshCw, CheckCircle, XCircle, Clock, Image, Film, Calendar, Database } from "lucide-react";
import { invokeAdminFunction } from "@/utils/adminFunctions";

export const AdminEnrichmentPanel = () => {
  const { toast } = useEnhancedToast();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState({ current: 0, total: 0 });

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
        title: "Bulk Processing Complete",
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

  const progressPercentage = progress.total > 0 
    ? (progress.current / progress.total) * 100 
    : 0;

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
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-background/40 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-sm text-muted-foreground">Pending Jobs</p>
              <p className="text-2xl font-bold text-foreground">{stats?.pendingJobs || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-background/40 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Complete Authors</p>
              <p className="text-2xl font-bold text-foreground">{stats?.completeAuthors || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-background/40 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-sm text-muted-foreground">Need Enrichment</p>
              <p className="text-2xl font-bold text-foreground">{stats?.authorsNeedingEnrichment || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-background/40 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Quality</p>
              <p className="text-2xl font-bold text-foreground">{stats?.avgQuality || 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bulk Processing Control */}
      <Card className="p-6 bg-background/40 backdrop-blur-md border-border/50">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Bulk Processing</h3>
            <p className="text-sm text-muted-foreground">
              Process all pending author enrichment jobs. This will fetch data from Wikipedia for all authors missing bios.
            </p>
          </div>

          {bulkProcessMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processing...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          <Button
            onClick={() => bulkProcessMutation.mutate()}
            disabled={bulkProcessMutation.isPending || (stats?.pendingJobs || 0) === 0}
            className="w-full"
            size="lg"
          >
            {bulkProcessMutation.isPending ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5 mr-2" />
                Process All Pending ({stats?.pendingJobs || 0} jobs)
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Estimated time: ~{Math.ceil((stats?.pendingJobs || 0) / 10) * 6} seconds
          </p>
        </div>
      </Card>

      {/* Book Cover Enrichment */}
      <Card className="p-6 bg-background/40 backdrop-blur-md border-border/50">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Book Cover Enrichment</h3>
            <p className="text-sm text-muted-foreground">
              Automatically fetch missing book covers from Google Books API.
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Image className="h-4 w-4" />
              <span>{coverStats?.missingCovers || 0} books missing covers</span>
            </div>
          </div>

          {coverEnrichmentMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Fetching covers...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          <Button
            onClick={() => coverEnrichmentMutation.mutate()}
            disabled={coverEnrichmentMutation.isPending || (coverStats?.missingCovers || 0) === 0}
            className="w-full"
            size="lg"
            variant="secondary"
          >
            {coverEnrichmentMutation.isPending ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Fetching Covers...
              </>
            ) : (
              <>
                <Image className="h-5 w-5 mr-2" />
                Fetch Missing Covers ({coverStats?.missingCovers || 0} books)
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Film Adaptation Book Enrichment */}
      <Card className="p-6 bg-background/40 backdrop-blur-md border-border/50">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Film Adaptation Book Data</h3>
            <p className="text-sm text-muted-foreground">
              Enrich book metadata for film adaptations (covers and publication years).
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-amber-400" />
                <span>{filmBookStats?.missingCovers || 0} missing covers</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <span>{filmBookStats?.missingYears || 0} missing years</span>
              </div>
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-muted-foreground" />
                <span>{filmBookStats?.totalFilms || 0} total films</span>
              </div>
            </div>
          </div>

          {filmBookEnrichmentMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Enriching book data...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          <Button
            onClick={() => filmBookEnrichmentMutation.mutate()}
            disabled={filmBookEnrichmentMutation.isPending || ((filmBookStats?.missingCovers || 0) === 0 && (filmBookStats?.missingYears || 0) === 0)}
            className="w-full"
            size="lg"
            variant="outline"
          >
            {filmBookEnrichmentMutation.isPending ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Enriching...
              </>
            ) : (
              <>
                <Film className="h-5 w-5 mr-2" />
                Enrich Film Book Data
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Populate Verified SF Films */}
      <Card className="p-6 bg-background/40 backdrop-blur-md border-amber-400/30">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Populate Verified SF Films</h3>
            <p className="text-sm text-muted-foreground">
              Add missing films from verified Criterion Collection and Arrow Films lists. 
              Automatically enriches with TMDB posters and Google Books covers.
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-400">
              <Database className="h-4 w-4" />
              <span>51 Criterion + 8 Arrow verified SF films</span>
            </div>
          </div>

          <Button
            onClick={() => populateVerifiedFilmsMutation.mutate()}
            disabled={populateVerifiedFilmsMutation.isPending}
            className="w-full bg-amber-600 hover:bg-amber-700"
            size="lg"
          >
            {populateVerifiedFilmsMutation.isPending ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Populating...
              </>
            ) : (
              <>
                <Database className="h-5 w-5 mr-2" />
                Populate Verified Films
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Automatic Scheduling Info */}
      <Card className="p-6 bg-background/40 backdrop-blur-md border-border/50">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground mb-2">Automatic Enrichment</h3>
          <p className="text-sm text-muted-foreground">
            The system automatically processes pending enrichment jobs every 6 hours.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Next scheduled run: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
