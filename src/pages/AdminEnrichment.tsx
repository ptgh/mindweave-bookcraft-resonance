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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { generateTransmissionEmbeddings } from "@/services/semanticSearchService";
import { invokeAdminFunction } from "@/utils/adminFunctions";
import { RefreshCw, Clock, Sparkles, ShieldCheck, Book, Film, Users, HardDrive, Activity, Tags } from "lucide-react";
import { useState } from "react";

const AdminEnrichment = () => {
  const { toast } = useEnhancedToast();
  const [isEnrichingTemporal, setIsEnrichingTemporal] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [isEnrichingTags, setIsEnrichingTags] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState({ processed: 0, total: 0 });
  const [embeddingProgress, setEmbeddingProgress] = useState({ processed: 0, skipped: 0, total: 0 });
  const [tagProgress, setTagProgress] = useState({ enriched: 0, processed: 0 });

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

  const handleEnrichTags = async () => {
    setIsEnrichingTags(true);
    setTagProgress({ enriched: 0, processed: 0 });
    
    try {
      toast({
        title: "Starting Tag Enrichment",
        description: "AI is analyzing transmissions and suggesting conceptual tags...",
      });

      const { data, error } = await supabase.functions.invoke('enrich-transmission-tags', {
        body: { limit: 50, minConfidence: 60 }
      });

      if (error) throw error;

      toast({
        title: "Tag Enrichment Complete",
        description: `Enriched ${data.results?.enriched || 0} of ${data.results?.processed || 0} transmissions with AI-suggested tags.`,
        variant: "success",
      });

      setTagProgress({ 
        enriched: data.results?.enriched || 0, 
        processed: data.results?.processed || 0 
      });
    } catch (error) {
      console.error('Tag enrichment error:', error);
      toast({
        title: "Tag Enrichment Failed",
        description: error instanceof Error ? error.message : "Failed to enrich tags",
        variant: "destructive",
      });
    } finally {
      setIsEnrichingTags(false);
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
              Manage and enrich all data - organized by category
            </p>
          </div>
          
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap gap-2 mb-6 p-4 bg-muted/20 rounded-lg border border-border/30">
            <Button
              onClick={handleTestAdminAuth}
              disabled={isTestingAuth}
              variant="outline"
              size="sm"
              className="border-green-500/50 text-green-400 hover:bg-green-500/10"
            >
              {isTestingAuth ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4 mr-2" />
              )}
              Test Auth
            </Button>
            
            <Button
              onClick={handleTemporalEnrichment}
              disabled={isEnrichingTemporal}
              variant="outline"
              size="sm"
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            >
              {isEnrichingTemporal ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Clock className="w-4 h-4 mr-2" />
              )}
              Temporal Enrichment
            </Button>
            
            <Button
              onClick={handleGenerateEmbeddings}
              disabled={isGeneratingEmbeddings}
              variant="outline"
              size="sm"
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
            >
              {isGeneratingEmbeddings ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Embeddings
            </Button>
            
            <Button
              onClick={handleEnrichTags}
              disabled={isEnrichingTags}
              variant="outline"
              size="sm"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            >
              {isEnrichingTags ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Tags className="w-4 h-4 mr-2" />
              )}
              AI Tag Enrichment
            </Button>
            
            {(enrichmentProgress.total > 0 || embeddingProgress.total > 0 || tagProgress.processed > 0) && (
              <div className="flex items-center gap-4 ml-auto text-sm text-muted-foreground">
                {enrichmentProgress.total > 0 && (
                  <span>Temporal: {enrichmentProgress.processed}/{enrichmentProgress.total}</span>
                )}
                {embeddingProgress.total > 0 && (
                  <span>Embeddings: {embeddingProgress.processed} new, {embeddingProgress.skipped} skipped</span>
                )}
                {tagProgress.processed > 0 && (
                  <span>Tags: {tagProgress.enriched}/{tagProgress.processed} enriched</span>
                )}
              </div>
            )}
          </div>

          {/* Data Health Dashboard - Always Visible */}
          <div className="mb-6">
            <AdminDataHealthPanel />
          </div>
          
          {/* Collapsible Sections */}
          <Accordion type="multiple" defaultValue={["books"]} className="space-y-4">
            
            {/* BOOKS Section */}
            <AccordionItem value="books" className="border border-emerald-500/30 rounded-lg bg-emerald-950/10">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Book className="w-5 h-5 text-emerald-400" />
                  <span className="text-lg font-semibold text-emerald-100">Books</span>
                  <span className="text-xs text-emerald-400/70 ml-2">Transmissions, Covers, Publisher Books</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                <AdminBooksPanel />
                <AdminPopulateBooks />
                <AdminImageUrlValidator />
              </AccordionContent>
            </AccordionItem>

            {/* FILMS Section */}
            <AccordionItem value="films" className="border border-amber-500/30 rounded-lg bg-amber-950/10">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Film className="w-5 h-5 text-amber-400" />
                  <span className="text-lg font-semibold text-amber-100">Films</span>
                  <span className="text-xs text-amber-400/70 ml-2">Adaptations, Trailers, External Links</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                <AdminFilmAdaptationsPanel />
                <AdminTrailersPanel />
                <AdminExternalLinksPanel />
              </AccordionContent>
            </AccordionItem>

            {/* AUTHORS Section */}
            <AccordionItem value="authors" className="border border-cyan-500/30 rounded-lg bg-cyan-950/10">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span className="text-lg font-semibold text-cyan-100">Authors & Directors</span>
                  <span className="text-xs text-cyan-400/70 ml-2">SF Authors, Directors, Enrichment</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                <AdminEnrichmentPanel />
                <AdminDirectorsPanel />
              </AccordionContent>
            </AccordionItem>

            {/* CACHE & SYSTEM Section */}
            <AccordionItem value="cache" className="border border-slate-500/30 rounded-lg bg-slate-950/10">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-slate-400" />
                  <span className="text-lg font-semibold text-slate-100">Cache & System</span>
                  <span className="text-xs text-slate-400/70 ml-2">Image Cache, Storage Management</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                <AdminCachePanel />
                
                {/* System Info Card */}
                <Card className="border-slate-500/30 bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                      <Activity className="w-5 h-5" />
                      System Information
                    </CardTitle>
                    <CardDescription>AI enrichment and automation details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-foreground mb-1">Temporal Enrichment</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Uses OpenAI tool calling with 95 controlled vocabulary tags</li>
                          <li>Rate limited: 1 request/second</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">Semantic Embeddings</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>OpenAI text-embedding-3-small model</li>
                          <li>Generates from title, author, notes, tags</li>
                        </ul>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/30">
                      <p className="font-medium text-foreground mb-1">Automatic Scheduling</p>
                      <p className="text-xs">Enrichment jobs run every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)</p>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
            
          </Accordion>
        </main>
      </div>
    </ProtectedAdminRoute>
  );
};

export default AdminEnrichment;
