import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { Loader2, Database, CheckCircle2 } from "lucide-react";

export const AdminPopulateBooks = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
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

  return (
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
  );
};
