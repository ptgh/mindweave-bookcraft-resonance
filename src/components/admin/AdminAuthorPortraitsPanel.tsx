import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ImageIcon, User, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AuthorPortrait {
  id: string;
  name: string;
  nationality: string | null;
  bio: string | null;
  birth_year: number | null;
  death_year: number | null;
  portrait_url: string | null;
}

export const AdminAuthorPortraitsPanel = () => {
  const [authors, setAuthors] = useState<AuthorPortrait[]>([]);
  const [loading, setLoading] = useState(true);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [enlargedAuthor, setEnlargedAuthor] = useState<AuthorPortrait | null>(null);

  useEffect(() => { fetchAuthors(); }, []);

  const fetchAuthors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scifi_authors")
      .select("id, name, nationality, bio, birth_year, death_year, portrait_url")
      .order("name");

    if (!error && data) setAuthors(data as AuthorPortrait[]);
    setLoading(false);
  };

  const regeneratePortrait = async (author: AuthorPortrait) => {
    setRegeneratingIds(prev => new Set(prev).add(author.id));
    try {
      await supabase
        .from("scifi_authors")
        .update({ portrait_url: null })
        .eq("id", author.id);

      const { data, error } = await supabase.functions.invoke("generate-author-portrait", {
        body: {
          authorName: author.name,
          authorId: author.id,
          bio: author.bio,
          nationality: author.nationality,
          birthYear: author.birth_year,
          deathYear: author.death_year,
        },
      });

      if (!error && data?.portraitUrl) {
        setAuthors(prev => prev.map(a => a.id === author.id ? { ...a, portrait_url: data.portraitUrl } : a));
        toast.success(`Portrait generated for ${author.name}`);
      } else {
        toast.error(`Failed to generate portrait for ${author.name}`);
      }
    } catch {
      toast.error(`Error generating portrait for ${author.name}`);
    } finally {
      setRegeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(author.id);
        return next;
      });
    }
  };

  const generateMissing = async () => {
    const missing = authors.filter(a => !a.portrait_url);
    if (missing.length === 0) {
      toast.info("All author portraits already generated");
      return;
    }

    setBulkGenerating(true);
    toast.info(`Generating ${missing.length} missing author portraits...`);

    let success = 0;
    for (const author of missing) {
      try {
        const { data, error } = await supabase.functions.invoke("generate-author-portrait", {
          body: {
            authorName: author.name,
            authorId: author.id,
            bio: author.bio,
            nationality: author.nationality,
            birthYear: author.birth_year,
            deathYear: author.death_year,
          },
        });

        if (!error && data?.portraitUrl) {
          success++;
          setAuthors(prev => prev.map(a => a.id === author.id ? { ...a, portrait_url: data.portraitUrl } : a));
        }
        await new Promise(r => setTimeout(r, 2000));
      } catch { /* continue */ }
    }

    setBulkGenerating(false);
    toast.success(`Generated ${success}/${missing.length} author portraits`);
  };

  const withPortrait = authors.filter(a => a.portrait_url);
  const withoutPortrait = authors.filter(a => !a.portrait_url);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              <CardTitle className="text-base">Author Portraits</CardTitle>
            </div>
            <CardDescription className="text-xs">
              AI-generated lifelike author representations
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
                className="border-blue-500/30 text-blue-400"
              >
                {bulkGenerating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4 mr-1" />
                )}
                <span className="hidden sm:inline">Generate Missing</span>
                <span className="sm:hidden">Generate</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={fetchAuthors}>
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
              {authors.map(a => {
                const isRegenerating = regeneratingIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    className="relative group bg-muted/20 rounded-lg p-3 flex flex-col items-center text-center border border-slate-700/30 hover:border-blue-500/30 transition-colors"
                  >
                    {isRegenerating ? (
                      <Skeleton className="w-16 h-16 rounded-full mb-2" />
                    ) : (
                      <button
                        onClick={() => a.portrait_url && setEnlargedAuthor(a)}
                        className="focus:outline-none"
                        disabled={!a.portrait_url}
                      >
                        <Avatar className="h-16 w-16 border-2 border-blue-500/30 shadow-lg shadow-blue-500/10 mb-2 cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all bg-slate-800">
                          {a.portrait_url ? (
                            <AvatarImage src={a.portrait_url} alt={a.name} className="object-cover w-full h-full" />
                          ) : null}
                          <AvatarFallback className="bg-slate-800 text-blue-400">
                            <User className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    )}
                    <p className="text-xs font-medium text-slate-200 leading-tight line-clamp-1">{a.name}</p>
                    {a.nationality && (
                      <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1 mt-0.5">{a.nationality}</p>
                    )}
                    {!a.portrait_url && !isRegenerating && (
                      <Badge variant="outline" className="mt-1 text-[8px] border-amber-500/30 text-amber-400 px-1">
                        missing
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => regeneratePortrait(a)}
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

      {enlargedAuthor && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setEnlargedAuthor(null)}
        >
          <div className="flex flex-col items-center p-6" onClick={e => e.stopPropagation()}>
            <img
              src={enlargedAuthor.portrait_url!}
              alt={enlargedAuthor.name}
              className="w-64 h-64 sm:w-80 sm:h-80 rounded-full object-cover border-4 border-blue-500/30 shadow-2xl shadow-blue-500/20"
            />
            <h3 className="mt-4 text-lg font-medium text-slate-200">{enlargedAuthor.name}</h3>
            <p className="text-sm text-muted-foreground">
              {enlargedAuthor.nationality}
              {enlargedAuthor.birth_year && ` · ${enlargedAuthor.birth_year}${enlargedAuthor.death_year ? `–${enlargedAuthor.death_year}` : ''}`}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
