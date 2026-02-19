import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import { RefreshCw, ImageIcon, MessageCircle, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

interface ProtagonistPortrait {
  id: number;
  title: string;
  author: string;
  protagonist: string;
  protagonist_portrait_url: string | null;
}

export const AdminPortraitsPanel = () => {
  const [portraits, setPortraits] = useState<ProtagonistPortrait[]>([]);
  const [loading, setLoading] = useState(true);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<number>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [enlargedPortrait, setEnlargedPortrait] = useState<ProtagonistPortrait | null>(null);

  useEffect(() => {
    fetchPortraits();
  }, []);

  const fetchPortraits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transmissions")
      .select("id, title, author, protagonist, protagonist_portrait_url")
      .not("protagonist", "is", null)
      .neq("protagonist", "")
      .order("title");

    if (!error && data) {
      // Deduplicate by title
      const seen = new Set<string>();
      const deduped = data.filter((b) => {
        const key = b.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setPortraits(deduped as ProtagonistPortrait[]);
    }
    setLoading(false);
  };

  const regeneratePortrait = async (book: ProtagonistPortrait) => {
    setRegeneratingIds((prev) => new Set(prev).add(book.id));
    try {
      // Clear existing URL first so edge function regenerates
      await supabase
        .from("transmissions")
        .update({ protagonist_portrait_url: null })
        .eq("id", book.id);

      const { data, error } = await supabase.functions.invoke("generate-protagonist-portrait", {
        body: {
          bookTitle: book.title,
          bookAuthor: book.author,
          protagonistName: book.protagonist,
          transmissionId: book.id,
        },
      });

      if (!error && data?.portraitUrl) {
        setPortraits((prev) =>
          prev.map((p) => (p.id === book.id ? { ...p, protagonist_portrait_url: data.portraitUrl } : p))
        );
        toast.success(`Portrait generated for ${book.protagonist}`);
      } else {
        toast.error(`Failed to generate portrait for ${book.protagonist}`);
      }
    } catch (e) {
      toast.error(`Error generating portrait for ${book.protagonist}`);
    } finally {
      setRegeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(book.id);
        return next;
      });
    }
  };

  const generateMissing = async () => {
    const missing = portraits.filter((p) => !p.protagonist_portrait_url);
    if (missing.length === 0) {
      toast.info("All portraits already generated");
      return;
    }

    setBulkGenerating(true);
    toast.info(`Generating ${missing.length} missing portraits...`);

    let success = 0;
    for (const book of missing) {
      try {
        const { data, error } = await supabase.functions.invoke("generate-protagonist-portrait", {
          body: {
            bookTitle: book.title,
            bookAuthor: book.author,
            protagonistName: book.protagonist,
            transmissionId: book.id,
          },
        });

        if (!error && data?.portraitUrl) {
          success++;
          setPortraits((prev) =>
            prev.map((p) => (p.id === book.id ? { ...p, protagonist_portrait_url: data.portraitUrl } : p))
          );
        }
        // Rate limit pause
        await new Promise((r) => setTimeout(r, 2000));
      } catch {
        // continue
      }
    }

    setBulkGenerating(false);
    toast.success(`Generated ${success}/${missing.length} portraits`);
  };

  const withPortrait = portraits.filter((p) => p.protagonist_portrait_url);
  const withoutPortrait = portraits.filter((p) => !p.protagonist_portrait_url);

  return (
    <>
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-violet-400" />
            <CardTitle className="text-base">Protagonist Portraits</CardTitle>
          </div>
          <CardDescription className="text-xs">
            AI-generated character portraits from literary descriptions
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              {withPortrait.length}
            </Badge>
            {withoutPortrait.length > 0 && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                <AlertCircle className="h-3 w-3 mr-1" />
                {withoutPortrait.length} missing
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={generateMissing}
              disabled={bulkGenerating || withoutPortrait.length === 0}
              className="border-violet-500/30 text-violet-400"
            >
              {bulkGenerating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4 mr-1" />
              )}
              <span className="hidden sm:inline">Generate Missing</span>
              <span className="sm:hidden">Generate</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchPortraits}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {portraits.map((p) => {
              const isRegenerating = regeneratingIds.has(p.id);
              return (
                <div
                  key={p.id}
                  className="relative group bg-muted/20 rounded-lg p-3 flex flex-col items-center text-center border border-slate-700/30 hover:border-violet-500/30 transition-colors"
                >
                  {isRegenerating ? (
                    <Skeleton className="w-16 h-16 rounded-full mb-2" />
                  ) : (
                    <button
                      onClick={() => p.protagonist_portrait_url && setEnlargedPortrait(p)}
                      className="focus:outline-none"
                      disabled={!p.protagonist_portrait_url}
                    >
                      <Avatar className="h-16 w-16 border-2 border-violet-500/30 shadow-lg shadow-violet-500/10 mb-2 cursor-pointer hover:ring-2 hover:ring-violet-400/50 transition-all bg-slate-800">
                        {p.protagonist_portrait_url ? (
                          <AvatarImage src={p.protagonist_portrait_url} alt={p.protagonist} className="object-cover w-full h-full" />
                        ) : null}
                        <AvatarFallback className="bg-slate-800 text-violet-400">
                          <MessageCircle className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  )}
                  <p className="text-xs font-medium text-slate-200 leading-tight line-clamp-1">
                    {p.protagonist}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1 mt-0.5">
                    {p.title}
                  </p>
                  {!p.protagonist_portrait_url && !isRegenerating && (
                    <Badge variant="outline" className="mt-1 text-[8px] border-amber-500/30 text-amber-400 px-1">
                      missing
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => regeneratePortrait(p)}
                    disabled={isRegenerating}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    title="Regenerate portrait"
                  >
                    {isRegenerating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Portrait Lightbox — tap overlay to close, no X */}
    {enlargedPortrait && (
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={() => setEnlargedPortrait(null)}
      >
        <div className="flex flex-col items-center p-6" onClick={(e) => e.stopPropagation()}>
          <img
            src={enlargedPortrait.protagonist_portrait_url!}
            alt={enlargedPortrait.protagonist}
            className="w-64 h-64 sm:w-80 sm:h-80 rounded-full object-cover border-4 border-violet-500/30 shadow-2xl shadow-violet-500/20"
          />
          <h3 className="mt-4 text-lg font-medium text-slate-200">{enlargedPortrait.protagonist}</h3>
          <p className="text-sm text-muted-foreground">{enlargedPortrait.title} · {enlargedPortrait.author}</p>
        </div>
      </div>
    )}
    </>
  );
};
