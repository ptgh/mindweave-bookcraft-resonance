import { AdminEnrichmentPanel } from "@/components/AdminEnrichmentPanel";
import { AdminPopulateBooks } from "@/components/AdminPopulateBooks";
import { AdminFilmAdaptationsPanel } from "@/components/AdminFilmAdaptationsPanel";
import { AdminDirectorsPanel } from "@/components/AdminDirectorsPanel";
import { AdminImageUrlValidator } from "@/components/AdminImageUrlValidator";
import { AdminBooksPanel, AdminTrailersPanel, AdminExternalLinksPanel, AdminCachePanel, AdminDataHealthPanel } from "@/components/admin";
import Header from "@/components/Header";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { generateTransmissionEmbeddings } from "@/services/semanticSearchService";
import { invokeAdminFunction } from "@/utils/adminFunctions";
import { RefreshCw, Clock, Sparkles, ShieldCheck, Database } from "lucide-react";
import { useState } from "react";

const AdminEnrichment = () => {
  const { toast } = useEnhancedToast();
  const [isEnrichingTemporal, setIsEnrichingTemporal] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState({ processed: 0, total: 0 });
  const [embeddingProgress, setEmbeddingProgress] = useState({ processed: 0, skipped: 0, total: 0 });

  const handleTemporalEnrichment = async () => {
    setIsEnrichingTemporal(true);
    setEnrichmentProgress({ processed: 0, total: 0 });
    
    try {
      toast({
        title: "Starting Temporal Enrichment",
        description: "Calling edge function to enrich timeline data...",
      });

      const { data, error } = await supabase.functions.invoke('enrich-timeline-data');

      if (error) throw error;

      toast({
        title: "Temporal Enrichment Complete",
        description: `Successfully enriched ${data.enriched?.length || 0} books with structured temporal metadata.`,
        variant: "success",
      });

      setEnrichmentProgress({ 
        processed: data.enriched?.length || 0, 
        total: data.enriched?.length || 0 
      });
    } catch (error) {
      console.error('Temporal enrichment error:', error);
      toast({
        title: "Enrichment Failed",
        description: error instanceof Error ? error.message : "Failed to enrich temporal data",
        variant: "destructive",
      });
    } finally {
      setIsEnrichingTemporal(false);
    }
  };

  const handleGenerateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    setEmbeddingProgress({ processed: 0, skipped: 0, total: 0 });
    
    try {
      toast({
        title: "Generating Embeddings",
        description: "Creating semantic embeddings for transmissions...",
      });

      const result = await generateTransmissionEmbeddings(100);

      toast({
        title: "Embedding Generation Complete",
        description: `Created ${result.processed} new embeddings. ${result.skipped} already existed.`,
        variant: "success",
      });

      setEmbeddingProgress({ 
        processed: result.processed, 
        skipped: result.skipped,
        total: result.total 
      });
    } catch (error) {
      console.error('Embedding generation error:', error);
      toast({
        title: "Embedding Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate embeddings",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  const handleTestAdminAuth = async () => {
    setIsTestingAuth(true);
    try {
      const { data, error } = await invokeAdminFunction<{ ok: boolean; userId: string | null; mode: string }>("admin-whoami");
      
      if (error) {
        toast({
          title: "Auth Test Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Auth Test Passed",
        description: `Mode: ${data?.mode} | User: ${data?.userId?.slice(0, 8) || 'internal'}...`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Auth Test Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsTestingAuth(false);
    }
  };

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Data Enrichment Administration
            </h1>
            <p className="text-muted-foreground">
              Manage author and temporal data enrichment
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Admin Auth Test */}
            <Card className="border-green-500/30 bg-green-950/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                  <CardTitle>Admin Auth Test</CardTitle>
                </div>
                <CardDescription>
                  Test bearer token wiring, admin detection, and CORS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleTestAdminAuth}
                  disabled={isTestingAuth}
                  variant="outline"
                  className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                >
                  {isTestingAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Test Admin Auth (whoami)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Temporal Context Enrichment */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <CardTitle>Temporal Context Enrichment</CardTitle>
                </div>
                <CardDescription>
                  Enrich books with structured temporal metadata: Literary Era (20 tags), Historical Forces (35 tags), Technological Context (40 tags)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleTemporalEnrichment}
                    disabled={isEnrichingTemporal}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isEnrichingTemporal ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Enriching...
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Enrich Temporal Context
                      </>
                    )}
                  </Button>
                  
                  {enrichmentProgress.total > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Processed: {enrichmentProgress.processed} / {enrichmentProgress.total} books
                    </span>
                  )}
                </div>
                
                {isEnrichingTemporal && (
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-sm text-slate-300 mb-2">Enrichment in progress...</p>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: enrichmentProgress.total > 0 
                            ? `${(enrichmentProgress.processed / enrichmentProgress.total) * 100}%` 
                            : '0%' 
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-slate-400 space-y-1">
                  <p>• Uses OpenAI tool calling with controlled vocabulary (95 tags)</p>
                  <p>• Includes: Golden Age, Cyberpunk Era, Cold War Tensions, Nuclear Age, PC Revolution, AI Emergence, etc.</p>
                  <p>• Rate limited to 1 request per second to avoid API throttling</p>
                </div>
              </CardContent>
            </Card>

            {/* Semantic Embeddings Generation */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <CardTitle>Semantic Search Embeddings</CardTitle>
                </div>
                <CardDescription>
                  Generate OpenAI embeddings for transmissions to enable AI-powered semantic search
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleGenerateEmbeddings}
                    disabled={isGeneratingEmbeddings}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isGeneratingEmbeddings ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Embeddings
                      </>
                    )}
                  </Button>
                  
                  {embeddingProgress.total > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Created: {embeddingProgress.processed} | Skipped: {embeddingProgress.skipped} | Total: {embeddingProgress.total}
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-slate-400 space-y-1">
                  <p>• Uses OpenAI text-embedding-3-small model</p>
                  <p>• Generates embeddings from title, author, notes, and tags</p>
                  <p>• Skips transmissions that already have embeddings</p>
                  <p>• Required for semantic search functionality</p>
                </div>
              </CardContent>
            </Card>

            {/* Data Health Dashboard - Primary Panel */}
            <AdminDataHealthPanel />
            
            <AdminCachePanel />
            <AdminBooksPanel />
            <AdminTrailersPanel />
            <AdminExternalLinksPanel />
            <AdminPopulateBooks />
            <AdminFilmAdaptationsPanel />
            <AdminDirectorsPanel />
            <AdminImageUrlValidator />
            <AdminEnrichmentPanel />
          </div>
        </main>
      </div>
    </ProtectedAdminRoute>
  );
};

export default AdminEnrichment;
