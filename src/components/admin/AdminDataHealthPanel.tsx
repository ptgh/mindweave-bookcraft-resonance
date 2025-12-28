import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Play, 
  Clock,
  Database,
  Film,
  Image,
  Link2,
  Tv,
  FileText,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DataHealthStats {
  total_films: number;
  missing_poster: number;
  missing_trailer: number;
  missing_criterion_url: number;
  missing_tmdb_id: number;
  missing_book_id: number;
  missing_watch_providers: number;
  stale_watch_providers: number;
  missing_script_url: number;
}

interface JobLog {
  id: string;
  job_name: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  items_processed: number;
  items_updated: number;
  items_inserted: number;
  error_message: string | null;
}

export function AdminDataHealthPanel() {
  const [stats, setStats] = useState<DataHealthStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHealthStats();
    fetchRecentJobs();
  }, []);

  const fetchHealthStats = async () => {
    try {
      // Get total films and missing data counts
      const { data: films, error } = await supabase
        .from('sf_film_adaptations')
        .select('id, poster_url, trailer_url, criterion_url, imdb_id, book_id, watch_providers, watch_providers_updated_at, script_url, is_criterion_collection');

      if (error) throw error;

      const now = new Date();
      const staleThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

      const healthStats: DataHealthStats = {
        total_films: films?.length || 0,
        missing_poster: films?.filter(f => !f.poster_url).length || 0,
        missing_trailer: films?.filter(f => !f.trailer_url).length || 0,
        missing_criterion_url: films?.filter(f => f.is_criterion_collection && !f.criterion_url).length || 0,
        missing_tmdb_id: films?.filter(f => !f.imdb_id).length || 0,
        missing_book_id: films?.filter(f => !f.book_id).length || 0,
        missing_watch_providers: films?.filter(f => !f.watch_providers || Object.keys(f.watch_providers).length === 0).length || 0,
        stale_watch_providers: films?.filter(f => {
          if (!f.watch_providers_updated_at) return true;
          return new Date(f.watch_providers_updated_at) < staleThreshold;
        }).length || 0,
        missing_script_url: films?.filter(f => !f.script_url).length || 0,
      };

      setStats(healthStats);
    } catch (error) {
      console.error('Error fetching health stats:', error);
      toast.error('Failed to fetch data health stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_jobs_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentJobs((data as JobLog[]) || []);
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
    }
  };

  const runEnrichmentJob = async (jobName: string, functionName: string) => {
    if (runningJobs.has(jobName)) return;

    setRunningJobs(prev => new Set(prev).add(jobName));
    
    try {
      // Log job start
      const { data: jobLog, error: logError } = await supabase
        .from('admin_jobs_log')
        .insert({
          job_name: jobName,
          status: 'running',
        })
        .select()
        .single();

      if (logError) {
        console.error('Failed to create job log:', logError);
      }

      toast.info(`Starting ${jobName}...`);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {}
      });

      if (error) throw error;

      // Update job log with results
      if (jobLog) {
        await supabase
          .from('admin_jobs_log')
          .update({
            completed_at: new Date().toISOString(),
            status: 'completed',
            items_processed: data?.processed || 0,
            items_updated: data?.updated || data?.verifiedFilmsCount || 0,
            metadata: data,
          })
          .eq('id', jobLog.id);

        // Log data event
        await supabase
          .from('admin_data_events')
          .insert({
            event_name: `${jobName} completed`,
            event_type: 'audit',
            target_table: 'sf_film_adaptations',
            records_selected: data?.processed || 0,
            records_updated: data?.updated || data?.verifiedFilmsCount || 0,
            records_deleted: 0, // NEVER delete
            job_id: jobLog.id,
            details: data,
          });
      }

      toast.success(`${jobName} completed successfully`);
      fetchHealthStats();
      fetchRecentJobs();
    } catch (error) {
      console.error(`Error running ${jobName}:`, error);
      toast.error(`Failed to run ${jobName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRunningJobs(prev => {
        const next = new Set(prev);
        next.delete(jobName);
        return next;
      });
    }
  };

  const getHealthColor = (missing: number, total: number): string => {
    const percentage = (missing / total) * 100;
    if (percentage === 0) return 'text-green-500';
    if (percentage < 10) return 'text-yellow-500';
    if (percentage < 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-600">Running</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Health Overview
          </CardTitle>
          <CardDescription>
            Film adaptations data completeness ({stats?.total_films || 0} total films)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Missing Posters</span>
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(stats?.missing_poster || 0, stats?.total_films || 1)}`}>
                {stats?.missing_poster || 0}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Missing Trailers</span>
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(stats?.missing_trailer || 0, stats?.total_films || 1)}`}>
                {stats?.missing_trailer || 0}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Missing Book Links</span>
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(stats?.missing_book_id || 0, stats?.total_films || 1)}`}>
                {stats?.missing_book_id || 0}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Tv className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Missing Watch Providers</span>
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(stats?.missing_watch_providers || 0, stats?.total_films || 1)}`}>
                {stats?.missing_watch_providers || 0}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Stale Watch Data</span>
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(stats?.stale_watch_providers || 0, stats?.total_films || 1)}`}>
                {stats?.stale_watch_providers || 0}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Missing TMDB ID</span>
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(stats?.missing_tmdb_id || 0, stats?.total_films || 1)}`}>
                {stats?.missing_tmdb_id || 0}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Missing Scripts</span>
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(stats?.missing_script_url || 0, stats?.total_films || 1)}`}>
                {stats?.missing_script_url || 0}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Missing Criterion URLs</span>
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(stats?.missing_criterion_url || 0, stats?.total_films || 1)}`}>
                {stats?.missing_criterion_url || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrichment Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Enrichment Actions
          </CardTitle>
          <CardDescription>
            Run enrichment jobs to fill missing data. All operations are non-destructive (INSERT/UPDATE only).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => runEnrichmentJob('Enrich Film Artwork', 'enrich-film-artwork')}
              disabled={runningJobs.has('Enrich Film Artwork')}
            >
              {runningJobs.has('Enrich Film Artwork') ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Image className="h-4 w-4 mr-2" />
              )}
              Enrich Artwork
            </Button>

            <Button
              variant="outline"
              onClick={() => runEnrichmentJob('Enrich Trailer URLs', 'enrich-trailer-urls')}
              disabled={runningJobs.has('Enrich Trailer URLs')}
            >
              {runningJobs.has('Enrich Trailer URLs') ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Film className="h-4 w-4 mr-2" />
              )}
              Enrich Trailers
            </Button>

            <Button
              variant="outline"
              onClick={() => runEnrichmentJob('Match Film Books', 'match-film-books')}
              disabled={runningJobs.has('Match Film Books')}
            >
              {runningJobs.has('Match Film Books') ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              Match Books
            </Button>

            <Button
              variant="outline"
              onClick={() => runEnrichmentJob('Cache Watch Providers', 'cache-watch-providers')}
              disabled={runningJobs.has('Cache Watch Providers')}
            >
              {runningJobs.has('Cache Watch Providers') ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Tv className="h-4 w-4 mr-2" />
              )}
              Update Watch Providers
            </Button>

            <Button
              variant="outline"
              onClick={() => runEnrichmentJob('Enrich Criterion Links', 'enrich-criterion-links')}
              disabled={runningJobs.has('Enrich Criterion Links')}
            >
              {runningJobs.has('Enrich Criterion Links') ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Enrich Criterion
            </Button>

            <Button
              variant="outline"
              onClick={() => runEnrichmentJob('Enrich IMSDB Scripts', 'enrich-imsdb-scripts')}
              disabled={runningJobs.has('Enrich IMSDB Scripts')}
            >
              {runningJobs.has('Enrich IMSDB Scripts') ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Enrich Scripts
            </Button>

            <Separator orientation="vertical" className="h-10" />

            <Button
              variant="ghost"
              onClick={() => {
                fetchHealthStats();
                fetchRecentJobs();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>

            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('admin-count-films');
                  if (error) throw error;
                  console.log('[AdminDiagnostic] Results:', data);
                  toast.success('Diagnostic logged to console');
                } catch (e) {
                  console.error('Diagnostic failed:', e);
                  toast.error('Diagnostic failed - check console');
                }
              }}
            >
              <Database className="h-4 w-4 mr-2" />
              Run Diagnostic
            </Button>
          </div>

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div className="text-sm text-yellow-200">
                <strong>No Destructive Queries Policy:</strong> All enrichment operations use INSERT or UPDATE only. 
                DELETE and TRUNCATE are prohibited. If data removal is ever needed, use soft delete (deleted_at).
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Job Runs
          </CardTitle>
          <CardDescription>
            Last 10 enrichment job executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {recentJobs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No jobs have been run yet.</p>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{job.job_name}</span>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Started: {new Date(job.started_at).toLocaleString()}
                        {job.completed_at && ` • Completed: ${new Date(job.completed_at).toLocaleString()}`}
                      </div>
                      {job.error_message && (
                        <div className="text-xs text-red-400">{job.error_message}</div>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div>Processed: {job.items_processed}</div>
                      <div className="text-muted-foreground">
                        Updated: {job.items_updated} | Inserted: {job.items_inserted}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
