import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { ReadingNarrative } from '@/components/ReadingNarrative';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export default function ReadingInsights() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [narrative, setNarrative] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [cached, setCached] = useState(false);
  const [transmissions, setTransmissions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadInsights();
    }
  }, [user]);

  const loadInsights = async (forceRegenerate = false) => {
    if (!user) return;

    setIsLoading(true);

    try {
      // First, fetch user's transmissions
      const { data: transmissionsData, error: transmissionsError } = await supabase
        .from('transmissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (transmissionsError) throw transmissionsError;

      if (!transmissionsData || transmissionsData.length < 3) {
        toast({
          title: 'Not enough data yet',
          description: 'Add at least 3 books to generate your reading insights.',
        });
        setIsLoading(false);
        return;
      }

      setTransmissions(transmissionsData);

      // Get the current session for auth
      const { data: { session } } = await supabase.auth.getSession();

      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('ai-reading-narrative', {
        body: {
          userTransmissions: transmissionsData.map(t => ({
            title: t.title,
            author: t.author,
            tags: t.tags,
            historical_context_tags: t.historical_context_tags,
            publication_year: t.publication_year,
            created_at: t.created_at,
            notes: t.notes,
          })),
          timeframe: 'all',
          forceRegenerate,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      if (data) {
        setNarrative(data.narrative);
        setGeneratedAt(data.generated_at);
        setCached(data.cached || false);
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
      toast({
        title: 'Failed to generate insights',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await loadInsights(true);
    toast({
      title: 'Insights regenerated',
      description: 'Your reading narrative has been updated with the latest analysis.',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 text-primary/40" />
            <h2 className="text-2xl font-bold mb-2">Sign in to view insights</h2>
            <p className="text-muted-foreground">
              Your personalized reading narrative awaits
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/discovery')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Discovery
              </Button>
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Reading Insights</h1>
              </div>
            </div>
            
            {narrative && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            )}
          </div>

          {/* Generated timestamp */}
          {generatedAt && (
            <div className="text-sm text-muted-foreground mb-6">
              Generated {new Date(generatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {cached && ' (cached)'}
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoadingSpinner />
              <p className="text-muted-foreground mt-4">
                Analyzing your reading journey...
              </p>
            </div>
          ) : narrative ? (
            <ReadingNarrative narrative={narrative} transmissions={transmissions} />
          ) : (
            <div className="text-center py-20">
              <Brain className="h-16 w-16 mx-auto mb-4 text-primary/40" />
              <h2 className="text-xl font-bold mb-2">No insights yet</h2>
              <p className="text-muted-foreground mb-6">
                Add more books to your collection to generate insights
              </p>
              <Button onClick={() => navigate('/')}>
                Browse Books
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
