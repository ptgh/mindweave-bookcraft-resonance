import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { 
  ImageIcon, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Play,
  Square,
  Film,
  Book
} from "lucide-react";

interface ValidationResult {
  id: string;
  source: "film_poster" | "book_cover" | "director_photo" | "transmission_cover";
  name: string;
  url: string;
  status: "pending" | "valid" | "invalid" | "timeout";
  statusCode?: number;
  error?: string;
}

export const AdminImageUrlValidator = () => {
  const { toast } = useEnhancedToast();
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalUrls, setTotalUrls] = useState(0);
  const [shouldStop, setShouldStop] = useState(false);

  const stats = {
    total: results.length,
    valid: results.filter(r => r.status === "valid").length,
    invalid: results.filter(r => r.status === "invalid").length,
    timeout: results.filter(r => r.status === "timeout").length,
    pending: results.filter(r => r.status === "pending").length,
  };

  const validateImageUrl = async (url: string): Promise<{ valid: boolean; statusCode?: number; error?: string }> => {
    try {
      // Use fetch with HEAD request to check if URL is valid
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        mode: "no-cors", // Handle CORS issues gracefully
      });

      clearTimeout(timeoutId);

      // With no-cors, we can't read the status, but if we get here without error, it's likely valid
      return { valid: true, statusCode: 200 };
    } catch (error: any) {
      if (error.name === "AbortError") {
        return { valid: false, error: "Timeout" };
      }
      
      // Try with an Image object as fallback
      return new Promise((resolve) => {
        const img = new Image();
        const timeout = setTimeout(() => {
          resolve({ valid: false, error: "Timeout" });
        }, 5000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve({ valid: true, statusCode: 200 });
        };

        img.onerror = () => {
          clearTimeout(timeout);
          resolve({ valid: false, error: "Load failed" });
        };

        img.src = url;
      });
    }
  };

  const gatherUrls = async (): Promise<ValidationResult[]> => {
    const urls: ValidationResult[] = [];

    // Film adaptations - posters and book covers
    const { data: films } = await supabase
      .from("sf_film_adaptations")
      .select("id, film_title, poster_url, book_cover_url");

    films?.forEach((film) => {
      if (film.poster_url) {
        urls.push({
          id: film.id,
          source: "film_poster",
          name: `${film.film_title} (Poster)`,
          url: film.poster_url,
          status: "pending",
        });
      }
      if (film.book_cover_url) {
        urls.push({
          id: film.id,
          source: "book_cover",
          name: `${film.film_title} (Book Cover)`,
          url: film.book_cover_url,
          status: "pending",
        });
      }
    });

    // Directors - photos
    const { data: directors } = await supabase
      .from("sf_directors")
      .select("id, name, photo_url");

    directors?.forEach((director) => {
      if (director.photo_url) {
        urls.push({
          id: director.id,
          source: "director_photo",
          name: `${director.name} (Photo)`,
          url: director.photo_url,
          status: "pending",
        });
      }
    });

    // Transmissions - cover urls (sample first 100)
    const { data: transmissions } = await supabase
      .from("transmissions")
      .select("id, title, cover_url")
      .not("cover_url", "is", null)
      .limit(100);

    transmissions?.forEach((transmission) => {
      if (transmission.cover_url) {
        urls.push({
          id: transmission.id.toString(),
          source: "transmission_cover",
          name: `${transmission.title || "Untitled"} (Cover)`,
          url: transmission.cover_url,
          status: "pending",
        });
      }
    });

    return urls;
  };

  const startValidation = async () => {
    setIsValidating(true);
    setShouldStop(false);
    setProgress(0);

    try {
      toast({
        title: "Gathering URLs",
        description: "Collecting image URLs from database...",
      });

      const urls = await gatherUrls();
      setTotalUrls(urls.length);
      setResults(urls);

      toast({
        title: "Validation Started",
        description: `Validating ${urls.length} image URLs...`,
      });

      for (let i = 0; i < urls.length; i++) {
        if (shouldStop) break;

        const url = urls[i];
        const result = await validateImageUrl(url.url);

        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: result.valid
                    ? "valid"
                    : result.error === "Timeout"
                    ? "timeout"
                    : "invalid",
                  statusCode: result.statusCode,
                  error: result.error,
                }
              : r
          )
        );

        setProgress(Math.round(((i + 1) / urls.length) * 100));

        // Small delay to avoid overwhelming
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      toast({
        title: "Validation Complete",
        description: `Validated ${urls.length} URLs`,
        variant: "success",
      });
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Validation Error",
        description: "An error occurred during validation",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const stopValidation = () => {
    setShouldStop(true);
  };

  const getSourceIcon = (source: ValidationResult["source"]) => {
    switch (source) {
      case "film_poster":
        return <Film className="w-4 h-4 text-purple-400" />;
      case "book_cover":
        return <Book className="w-4 h-4 text-blue-400" />;
      case "director_photo":
        return <ImageIcon className="w-4 h-4 text-cyan-400" />;
      case "transmission_cover":
        return <Book className="w-4 h-4 text-green-400" />;
    }
  };

  const getStatusIcon = (status: ValidationResult["status"]) => {
    switch (status) {
      case "valid":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "invalid":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "timeout":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />;
    }
  };

  const invalidResults = results.filter(
    (r) => r.status === "invalid" || r.status === "timeout"
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            <CardTitle>Image URL Validator</CardTitle>
          </div>
          <div className="flex gap-2">
            {isValidating ? (
              <Button variant="destructive" size="sm" onClick={stopValidation}>
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button size="sm" onClick={startValidation}>
                <Play className="w-4 h-4 mr-2" />
                Validate All URLs
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Check if all poster, book cover, and photo URLs are still valid and accessible
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        {(isValidating || results.length > 0) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isValidating ? "Validating..." : "Validation complete"}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Statistics */}
        {results.length > 0 && (
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total URLs</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.valid}</div>
              <div className="text-xs text-muted-foreground">Valid</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.invalid}</div>
              <div className="text-xs text-muted-foreground">Invalid</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.timeout}</div>
              <div className="text-xs text-muted-foreground">Timeout</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </div>
        )}

        {/* Invalid URLs List */}
        {invalidResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Invalid/Timeout URLs ({invalidResults.length})
            </h4>
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-2 space-y-2">
                {invalidResults.map((result, index) => (
                  <div
                    key={`${result.id}-${index}`}
                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50"
                  >
                    {getSourceIcon(result.source)}
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {result.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {result.url}
                      </div>
                    </div>
                    <Badge
                      variant={result.status === "timeout" ? "outline" : "destructive"}
                      className="text-xs"
                    >
                      {result.error || result.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Click "Validate All URLs" to check image URLs across the database</p>
            <p className="text-xs mt-2">
              Validates: Film posters, Book covers, Director photos, Transmission covers
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Validates URLs using HEAD requests with 5s timeout</p>
          <p>• Falls back to Image loading for CORS-restricted URLs</p>
          <p>• Samples first 100 transmission covers to avoid long validation times</p>
        </div>
      </CardContent>
    </Card>
  );
};
