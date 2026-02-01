import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Image, RefreshCw, CheckCircle, AlertCircle, HardDrive, ExternalLink, 
  ChevronDown, ChevronRight, Database
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { invokeAdminFunction } from "@/utils/adminFunctions";

interface CoverHealthStats {
  total: number;
  cached: number;
  external: number;
  missing: number;
  cacheRate: number;
}

const getCoverHealthStats = async (): Promise<CoverHealthStats> => {
  const { data, error } = await supabase
    .from('sf_film_adaptations')
    .select('id, book_cover_url, adaptation_type')
    .neq('adaptation_type', 'original'); // Exclude original screenplays

  if (error) throw error;

  const films = data || [];
  const total = films.length;
  
  // Cached = URLs containing supabase.co/storage
  const cached = films.filter(f => 
    f.book_cover_url?.includes('supabase.co/storage')
  ).length;
  
  // External = has URL but not cached in Supabase
  const external = films.filter(f => 
    f.book_cover_url && 
    !f.book_cover_url.includes('supabase.co/storage')
  ).length;
  
  // Missing = null or empty cover_url
  const missing = films.filter(f => 
    !f.book_cover_url || f.book_cover_url.trim() === ''
  ).length;

  const cacheRate = total > 0 ? Math.round((cached / total) * 100) : 0;

  return { total, cached, external, missing, cacheRate };
};

export const AdminCoverHealthPanel = () => {
  const { toast } = useEnhancedToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['cover-health-stats'],
    queryFn: getCoverHealthStats,
    refetchInterval: 15000,
  });

  const enrichCoversMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeAdminFunction('enrich-film-book-covers');
      if (error) throw error;
      return data;
    },
    onSuccess: (result: any) => {
      toast({
        title: "Cover Enrichment Complete",
        description: `Processed ${result.processed || 0} films. ${result.cached || 0} newly cached, ${result.updated || 0} updated.`,
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ['cover-health-stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cover Enrichment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cacheRate = stats?.cacheRate || 0;
  const healthColor = cacheRate >= 90 ? 'text-green-400' : cacheRate >= 70 ? 'text-yellow-400' : 'text-red-400';

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="bg-background/40 backdrop-blur-md border-purple-400/30 overflow-hidden">
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-purple-400" />
            <h3 className="text-base font-semibold text-foreground">Cover Health</h3>
            <span className={`text-xs bg-muted/30 px-2 py-0.5 rounded ${healthColor}`}>
              {cacheRate}% cached
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-muted/20 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Database className="h-3 w-3" />
                      <span className="text-xs">Total</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{stats?.total || 0}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-xs">Cached</span>
                    </div>
                    <p className="text-lg font-bold text-green-400">{stats?.cached || 0}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">External</span>
                    </div>
                    <p className="text-lg font-bold text-yellow-400">{stats?.external || 0}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs">Missing</span>
                    </div>
                    <p className="text-lg font-bold text-red-400">{stats?.missing || 0}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Cache Rate</span>
                    <span>{stats?.cacheRate || 0}%</span>
                  </div>
                  <Progress 
                    value={stats?.cacheRate || 0} 
                    className="h-2" 
                  />
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground">
                  Cached covers are stored in Supabase storage for reliability. 
                  External URLs may break over time. Run enrichment to cache external URLs.
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => enrichCoversMutation.mutate()}
                    disabled={enrichCoversMutation.isPending || ((stats?.external || 0) === 0 && (stats?.missing || 0) === 0)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    size="sm"
                  >
                    {enrichCoversMutation.isPending ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Caching...</>
                    ) : (
                      <><Image className="h-4 w-4 mr-2" /> Cache External ({stats?.external || 0})</>
                    )}
                  </Button>
                  <Button
                    onClick={() => refetch()}
                    variant="outline"
                    size="sm"
                    className="border-purple-400/30"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
