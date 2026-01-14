import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { invokeAdminFunction } from "@/utils/adminFunctions";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { 
  Loader2, Database, CheckCircle2, BookOpen, Star, 
  BarChart3, RefreshCw, AlertTriangle, ImageOff, FileQuestion
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PopulateResult {
  booksAdded: number;
  seriesName?: string;
  books?: Array<{ title: string; author: string; isbn: string }>;
}

interface DataStats {
  totalBooks: number;
  totalAuthors: number;
  booksWithCovers: number;
  booksWithoutCovers: number;
  booksWithISBN: number;
  booksWithoutISBN: number;
  publisherBooks: number;
  authorBooks: number;
  pendingEnrichments: number;
  filmAdaptations: number;
  filmsMissingPosters: number;
  filmsMissingBookCovers: number;
  sfDirectors: number;
}

interface ValidationIssue {
  type: 'missing_cover' | 'missing_isbn' | 'missing_description';
  count: number;
  samples: Array<{ title: string; author: string }>;
}

export const AdminPopulateBooks = () => {
  const [loading, setLoading] = useState(false);
  const [loadingPenguin, setLoadingPenguin] = useState(false);
  const [loadingGollancz, setLoadingGollancz] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingCovers, setLoadingCovers] = useState(false);
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [loadingEnrichment, setLoadingEnrichment] = useState(false);
  
  const [results, setResults] = useState<any>(null);
  const [penguinResults, setPenguinResults] = useState<PopulateResult | null>(null);
  const [gollanczResults, setGollanczResults] = useState<PopulateResult | null>(null);
  const [stats, setStats] = useState<DataStats | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [coverEnrichmentResult, setCoverEnrichmentResult] = useState<any>(null);
  const [enrichmentQueueStatus, setEnrichmentQueueStatus] = useState<any>(null);
  
  const { toast } = useEnhancedToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [
        authorBooksRes,
        publisherBooksRes,
        authorsRes,
        enrichmentQueueRes,
        publisherBooksWithCoversRes,
        authorBooksWithCoversRes,
        filmAdaptationsRes,
        filmsMissingPostersRes,
        filmsMissingBookCoversRes,
        sfDirectorsRes
      ] = await Promise.all([
        supabase.from('author_books').select('id, cover_url, google_books_id', { count: 'exact' }),
        supabase.from('publisher_books').select('id, cover_url, isbn', { count: 'exact' }),
        supabase.from('scifi_authors').select('id', { count: 'exact' }),
        supabase.from('author_enrichment_queue').select('id, status', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('publisher_books').select('id').not('cover_url', 'is', null),
        supabase.from('author_books').select('id').not('cover_url', 'is', null),
        supabase.from('sf_film_adaptations').select('id', { count: 'exact' }),
        supabase.from('sf_film_adaptations').select('id', { count: 'exact' }).is('poster_url', null),
        supabase.from('sf_film_adaptations').select('id', { count: 'exact' }).is('book_cover_url', null),
        supabase.from('sf_directors').select('id', { count: 'exact' })
      ]);

      const authorBooks = authorBooksRes.data || [];
      const publisherBooks = publisherBooksRes.data || [];
      
      const booksWithCovers = (publisherBooksWithCoversRes.count || 0) + (authorBooksWithCoversRes.count || 0);
      const totalBooks = (authorBooksRes.count || 0) + (publisherBooksRes.count || 0);
      
      const booksWithISBN = publisherBooks.filter(b => b.isbn).length + 
                           authorBooks.filter(b => b.google_books_id).length;

      setStats({
        totalBooks,
        totalAuthors: authorsRes.count || 0,
        booksWithCovers,
        booksWithoutCovers: totalBooks - booksWithCovers,
        booksWithISBN,
        booksWithoutISBN: totalBooks - booksWithISBN,
        publisherBooks: publisherBooksRes.count || 0,
        authorBooks: authorBooksRes.count || 0,
        pendingEnrichments: enrichmentQueueRes.count || 0,
        filmAdaptations: filmAdaptationsRes.count || 0,
        filmsMissingPosters: filmsMissingPostersRes.count || 0,
        filmsMissingBookCovers: filmsMissingBookCoversRes.count || 0,
        sfDirectors: sfDirectorsRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const runValidation = async () => {
    setLoadingValidation(true);
    setValidationIssues([]);
    
    try {
      const { data: noCoverBooks } = await supabase
        .from('author_books')
        .select('title, author_id')
        .is('cover_url', null)
        .limit(5);
      
      const { data: noDescBooks, count: noDescCount } = await supabase
        .from('author_books')
        .select('title, author_id', { count: 'exact' })
        .is('description', null)
        .limit(5);

      const authorIds = [...new Set([
        ...(noCoverBooks || []).map(b => b.author_id),
        ...(noDescBooks || []).map(b => b.author_id)
      ])].filter(Boolean);

      const { data: authors } = await supabase
        .from('scifi_authors')
        .select('id, name')
        .in('id', authorIds);

      const authorMap = new Map(authors?.map(a => [a.id, a.name]) || []);

      const issues: ValidationIssue[] = [];

      if (noCoverBooks && noCoverBooks.length > 0) {
        const { count } = await supabase
          .from('author_books')
          .select('id', { count: 'exact', head: true })
          .is('cover_url', null);
        
        issues.push({
          type: 'missing_cover',
          count: count || 0,
          samples: noCoverBooks.map(b => ({
            title: b.title,
            author: authorMap.get(b.author_id) || 'Unknown'
          }))
        });
      }

      if (noDescBooks && noDescBooks.length > 0) {
        issues.push({
          type: 'missing_description',
          count: noDescCount || 0,
          samples: noDescBooks.map(b => ({
            title: b.title,
            author: authorMap.get(b.author_id) || 'Unknown'
          }))
        });
      }

      setValidationIssues(issues);
      
      toast({
        title: "Validation Complete",
        description: `Found ${issues.length} issue types requiring attention.`,
        variant: issues.length > 0 ? "default" : "success"
      });
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingValidation(false);
    }
  };

  const handleEnrichCovers = async () => {
    setLoadingCovers(true);
    setCoverEnrichmentResult(null);
    
    try {
      toast({
        title: "Starting cover enrichment",
        description: "Fetching missing covers from Google Books API...",
      });

      const { data, error } = await invokeAdminFunction('enrich-book-covers');

      if (error) throw error;

      setCoverEnrichmentResult(data);
      await fetchStats();
      
      toast({
        title: "Cover Enrichment Complete!",
        description: `Updated ${(data as any).updated || 0} book covers.`,
        duration: 5000,
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error enriching covers:', error);
      toast({
        title: "Cover enrichment failed",
        description: error.message || "Failed to enrich book covers",
        variant: "destructive",
      });
    } finally {
      setLoadingCovers(false);
    }
  };

  const handleProcessEnrichmentQueue = async () => {
    setLoadingEnrichment(true);
    setEnrichmentQueueStatus(null);
    
    try {
      toast({
        title: "Processing enrichment queue",
        description: "Enriching author data from Wikipedia and other sources...",
      });

      const { data, error } = await invokeAdminFunction('enrich-author-data');

      if (error) throw error;

      setEnrichmentQueueStatus(data);
      await fetchStats();

      toast({
        title: "Enrichment Queue Processed!",
        description: `Processed ${(data as any).processed || 0} authors.`,
        duration: 5000,
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error processing enrichment queue:', error);
      toast({
        title: "Enrichment processing failed",
        description: error.message || "Failed to process enrichment queue",
        variant: "destructive",
      });
    } finally {
      setLoadingEnrichment(false);
    }
  };

  const handlePopulate = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      toast({
        title: "Starting population",
        description: "Fetching curated books and using AI to expand the library...",
      });

      const { data, error } = await invokeAdminFunction('populate-curated-books');

      if (error) throw error;

      setResults(data);
      await fetchStats();
      
      toast({
        title: "Population complete!",
        description: `Added ${(data as any).stats.booksAdded} books. Skipped ${(data as any).stats.booksSkipped} duplicates.`,
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

      const { data, error } = await invokeAdminFunction('populate-publisher-books', {
        series: 'penguin'
      });

      if (error) throw error;

      setPenguinResults(data as PopulateResult);
      await fetchStats();
      
      toast({
        title: "Penguin SF Complete!",
        description: `Added ${(data as any).booksAdded} Penguin Science Fiction titles.`,
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

      const { data, error } = await invokeAdminFunction('populate-publisher-books', {
        series: 'gollancz'
      });

      if (error) throw error;

      setGollanczResults(data as PopulateResult);
      await fetchStats();
      
      toast({
        title: "Gollancz SF Masterworks Complete!",
        description: `Added ${(data as any).booksAdded} SF Masterworks titles.`,
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

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'missing_cover': return <ImageOff className="w-4 h-4" />;
      case 'missing_isbn': return <FileQuestion className="w-4 h-4" />;
      case 'missing_description': return <FileQuestion className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getIssueLabel = (type: string) => {
    switch (type) {
      case 'missing_cover': return 'Missing Cover';
      case 'missing_isbn': return 'Missing ISBN';
      case 'missing_description': return 'Missing Description';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Data Statistics Dashboard */}
      <Card className="border-cyan-700/50 bg-gradient-to-br from-cyan-900/20 to-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-cyan-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Data Statistics Dashboard
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStats}
              disabled={loadingStats}
              className="text-cyan-300 hover:text-cyan-100"
            >
              {loadingStats ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </CardTitle>
          <CardDescription className="text-cyan-200/70">
            Overview of your book database health and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-cyan-400">{stats.totalBooks}</div>
                <div className="text-xs text-slate-400 mt-1">Total Books</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-400">{stats.totalAuthors}</div>
                <div className="text-xs text-slate-400 mt-1">Authors</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-emerald-400">{stats.booksWithCovers}</div>
                <div className="text-xs text-slate-400 mt-1">With Covers</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-orange-400">{stats.booksWithoutCovers}</div>
                <div className="text-xs text-slate-400 mt-1">Missing Covers</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-400">{stats.publisherBooks}</div>
                <div className="text-xs text-slate-400 mt-1">Publisher Books</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-400">{stats.authorBooks}</div>
                <div className="text-xs text-slate-400 mt-1">Author Matrix Books</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.pendingEnrichments}</div>
                <div className="text-xs text-slate-400 mt-1">Pending Enrichments</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-slate-400">{stats.booksWithISBN}</div>
                <div className="text-xs text-slate-400 mt-1">With ISBN</div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Populate Actions */}
      <Card className="border-emerald-700/50 bg-gradient-to-br from-emerald-900/20 to-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-100">
            <Database className="w-5 h-5 text-emerald-400" />
            Populate Book Database
          </CardTitle>
          <CardDescription className="text-emerald-200/70">
            Add curated science fiction books to the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handlePopulate}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
              Populate Curated Books
            </Button>
            <Button
              onClick={handlePopulatePenguinSF}
              disabled={loadingPenguin}
              variant="outline"
              className="border-orange-500/50 text-orange-300 hover:bg-orange-900/30"
            >
              {loadingPenguin ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
              Penguin Science Fiction
            </Button>
            <Button
              onClick={handlePopulateGollanczSF}
              disabled={loadingGollancz}
              variant="outline"
              className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-900/30"
            >
              {loadingGollancz ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
              Gollancz Masterworks
            </Button>
          </div>
          
          {renderResultsList(penguinResults, 'text-orange-400')}
          {renderResultsList(gollanczResults, 'text-yellow-400')}
        </CardContent>
      </Card>

      {/* Data Validation Results */}
      {validationIssues.length > 0 && (
        <Card className="border-amber-700/50 bg-gradient-to-br from-amber-900/20 to-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Validation Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {validationIssues.map((issue, idx) => (
                <div key={idx} className="bg-slate-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    {getIssueIcon(issue.type)}
                    <span className="font-semibold">{getIssueLabel(issue.type)}</span>
                    <Badge variant="outline" className="ml-auto">{issue.count} items</Badge>
                  </div>
                  <div className="text-xs text-slate-400 max-h-32 overflow-y-auto">
                    {issue.samples.map((s, i) => (
                      <div key={i}>• {s.title} by {s.author}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
