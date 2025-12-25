import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { Loader2, Database, CheckCircle2, BookOpen, Star } from "lucide-react";

interface PopulateResult {
  booksAdded: number;
  seriesName?: string;
  books?: Array<{ title: string; author: string; isbn: string }>;
}

export const AdminPopulateBooks = () => {
  const [loading, setLoading] = useState(false);
  const [loadingPenguin, setLoadingPenguin] = useState(false);
  const [loadingGollancz, setLoadingGollancz] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [penguinResults, setPenguinResults] = useState<PopulateResult | null>(null);
  const [gollanczResults, setGollanczResults] = useState<PopulateResult | null>(null);
  const { toast } = useEnhancedToast();

  const handlePopulate = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      toast({
        title: "Starting population",
        description: "Fetching curated books and using AI to expand the library...",
      });

      const { data, error } = await supabase.functions.invoke('populate-curated-books');

      if (error) throw error;

      setResults(data);
      
      toast({
        title: "Population complete!",
        description: `Added ${data.stats.booksAdded} books. Skipped ${data.stats.booksSkipped} duplicates.`,
        duration: 5000,
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error populating books:', error);
      toast({
        title: "Population failed",
        description: error.message || "Failed to populate books",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePopulatePenguinSF = async () => {
    setLoadingPenguin(true);
    setPenguinResults(null);
    
    try {
      toast({
        title: "Starting Penguin SF population",
        description: "Adding official Penguin Science Fiction titles with cover art...",
      });

      const { data, error } = await supabase.functions.invoke('populate-publisher-books', {
        body: { series: 'penguin' }
      });

      if (error) throw error;

      setPenguinResults(data);
      
      toast({
        title: "Penguin SF Complete!",
        description: `Added ${data.booksAdded} Penguin Science Fiction titles.`,
        duration: 5000,
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error populating Penguin SF books:', error);
      toast({
        title: "Penguin SF population failed",
        description: error.message || "Failed to populate Penguin SF books",
        variant: "destructive",
      });
    } finally {
      setLoadingPenguin(false);
    }
  };

  const handlePopulateGollanczSF = async () => {
    setLoadingGollancz(true);
    setGollanczResults(null);
    
    try {
      toast({
        title: "Starting Gollancz SF Masterworks population",
        description: "Adding iconic SF Masterworks titles with official cover art...",
      });

      const { data, error } = await supabase.functions.invoke('populate-publisher-books', {
        body: { series: 'gollancz' }
      });

      if (error) throw error;

      setGollanczResults(data);
      
      toast({
        title: "Gollancz SF Masterworks Complete!",
        description: `Added ${data.booksAdded} SF Masterworks titles.`,
        duration: 5000,
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error populating Gollancz SF books:', error);
      toast({
        title: "Gollancz SF Masterworks population failed",
        description: error.message || "Failed to populate Gollancz SF Masterworks books",
        variant: "destructive",
      });
    } finally {
      setLoadingGollancz(false);
    }
  };

  const renderResultsList = (resultData: PopulateResult | null, colorClass: string) => {
    if (!resultData) return null;
    
    return (
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>Successfully added {resultData.booksAdded} books</span>
        </div>
        {resultData.books && (
          <div className="bg-slate-900/50 p-3 rounded max-h-48 overflow-y-auto">
            <div className={`${colorClass} font-semibold mb-2`}>Added Titles:</div>
            <div className="space-y-1">
              {resultData.books.map((book, i) => (
                <div key={i} className="text-slate-300 text-xs">
                  • {book.title} by {book.author}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Penguin Science Fiction Population */}
      <Card className="border-amber-700/50 bg-gradient-to-br from-amber-900/20 to-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-100">
            <span className="text-xl">🐧</span>
            Populate Penguin Science Fiction
          </CardTitle>
          <CardDescription className="text-amber-200/70">
            Add all 19 official Penguin Science Fiction titles with authentic cover art from the Penguin CDN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handlePopulatePenguinSF}
            disabled={loadingPenguin}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loadingPenguin ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Populating Penguin SF...
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                Populate Penguin SF Books
              </>
            )}
          </Button>

          {renderResultsList(penguinResults, 'text-amber-300')}

          <p className="mt-4 text-xs text-amber-200/50">
            This will add the official 19 Penguin Science Fiction series titles to the Publisher Resonance section with authentic cover artwork.
          </p>
        </CardContent>
      </Card>

      {/* Gollancz SF Masterworks Population */}
      <Card className="border-yellow-600/50 bg-gradient-to-br from-yellow-900/20 to-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-100">
            <Star className="w-5 h-5 text-yellow-400" />
            Populate Gollancz SF Masterworks
          </CardTitle>
          <CardDescription className="text-yellow-200/70">
            Add 20 iconic SF Masterworks titles with official Gollancz cover art featuring the classic yellow-spine designs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handlePopulateGollanczSF}
            disabled={loadingGollancz}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {loadingGollancz ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Populating Gollancz SF Masterworks...
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                Populate Gollancz SF Masterworks
              </>
            )}
          </Button>

          {renderResultsList(gollanczResults, 'text-yellow-300')}

          <p className="mt-4 text-xs text-yellow-200/50">
            This will add 20 curated SF Masterworks titles featuring iconic works like Dune, Neuromancer, Hyperion, and more with official Gollancz cover artwork.
          </p>
        </CardContent>
      </Card>

      {/* Original Curated Books Population */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Database className="w-5 h-5" />
            Populate Curated Books
          </CardTitle>
          <CardDescription className="text-slate-400">
            Add curated sci-fi books from Wikipedia's "100 Best" list and AI-generated recommendations to the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handlePopulate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Populating Books...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Populate Curated Books
              </>
            )}
          </Button>

          {results && (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Successfully processed {results.totalProcessed} books</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300 bg-slate-900/50 p-3 rounded">
                <div>Books Added: <span className="text-blue-400 font-semibold">{results.stats.booksAdded}</span></div>
                <div>Books Skipped: <span className="text-slate-400">{results.stats.booksSkipped}</span></div>
              </div>
              {results.stats.errors.length > 0 && (
                <div className="text-orange-400 text-xs">
                  <div className="font-semibold mb-1">Errors ({results.stats.errors.length}):</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {results.stats.errors.slice(0, 5).map((err: string, i: number) => (
                      <div key={i} className="truncate">{err}</div>
                    ))}
                    {results.stats.errors.length > 5 && (
                      <div className="italic">...and {results.stats.errors.length - 5} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500">
            This will use Gemini AI to generate additional book recommendations and add them to the author matrix and book database. Duplicates will be automatically skipped.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
