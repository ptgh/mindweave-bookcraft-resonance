import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import { 
  Loader2, Database, CheckCircle2, BookOpen, Star, 
  BarChart3, Image, AlertTriangle, Users, History,
  RefreshCw, Eye, ImageOff, FileQuestion
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

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      // Fetch various counts in parallel
      const [
        authorBooksRes,
        publisherBooksRes,
        authorsRes,
        enrichmentQueueRes,
        publisherBooksWithCoversRes,
        authorBooksWithCoversRes
      ] = await Promise.all([
        supabase.from('author_books').select('id, cover_url, google_books_id', { count: 'exact' }),
        supabase.from('publisher_books').select('id, cover_url, isbn', { count: 'exact' }),
        supabase.from('scifi_authors').select('id', { count: 'exact' }),
        supabase.from('author_enrichment_queue').select('id, status', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('publisher_books').select('id').not('cover_url', 'is', null),
        supabase.from('author_books').select('id').not('cover_url', 'is', null)
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
        pendingEnrichments: enrichmentQueueRes.count || 0
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
      // Check for missing covers
      const { data: noCoverBooks } = await supabase
        .from('author_books')
        .select('title, author_id')
        .is('cover_url', null)
        .limit(5);
      
      // Check for missing descriptions
      const { data: noDescBooks, count: noDescCount } = await supabase
        .from('author_books')
        .select('title, author_id', { count: 'exact' })
        .is('description', null)
        .limit(5);

      // Get author names for samples
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

      const { data, error } = await supabase.functions.invoke('enrich-book-covers');

      if (error) throw error;

      setCoverEnrichmentResult(data);
      await fetchStats(); // Refresh stats
      
      toast({
        title: "Cover Enrichment Complete!",
        description: `Updated ${data.updated || 0} book covers.`,
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

      const { data, error } = await supabase.functions.invoke('queue-author-enrichment');

      if (error) throw error;

      setEnrichmentQueueStatus(data);
      await fetchStats(); // Refresh stats
      
      toast({
        title: "Enrichment Queue Processed!",
        description: `Processed ${data.processed || 0} authors.`,
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

      const { data, error } = await supabase.functions.invoke('populate-curated-books');

      if (error) throw error;

      setResults(data);
      await fetchStats(); // Refresh stats
      
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
      await fetchStats(); // Refresh stats
      
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
      await fetchStats(); // Refresh stats
      
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
                <div className="text-xs text-slate-400 mt-1">With ISBN/ID</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-4">No data available</div>
          )}
        </CardContent>
      </Card>

      {/* Data Validation */}
      <Card className="border-orange-700/50 bg-gradient-to-br from-orange-900/20 to-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-100">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Data Validation
          </CardTitle>
          <CardDescription className="text-orange-200/70">
            Check for books with incomplete data that need attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runValidation}
            disabled={loadingValidation}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loadingValidation ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Validation...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Run Data Validation
              </>
            )}
          </Button>

          {validationIssues.length > 0 && (
            <div className="mt-4 space-y-3">
              {validationIssues.map((issue, idx) => (
                <div key={idx} className="bg-slate-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getIssueIcon(issue.type)}
                    <Badge variant="outline" className="text-orange-300 border-orange-500/50">
                      {getIssueLabel(issue.type)}
                    </Badge>
                    <span className="text-orange-400 font-semibold">{issue.count} books</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-500">Samples:</span>
                    {issue.samples.map((s, i) => (
                      <span key={i} className="ml-2">
                        "{s.title}" by {s.author}{i < issue.samples.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cover Enrichment */}
      <Card className="border-emerald-700/50 bg-gradient-to-br from-emerald-900/20 to-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-100">
            <Image className="w-5 h-5 text-emerald-400" />
            Cover Enrichment
          </CardTitle>
          <CardDescription className="text-emerald-200/70">
            Fetch missing book covers from Google Books API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleEnrichCovers}
            disabled={loadingCovers}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loadingCovers ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enriching Covers...
              </>
            ) : (
              <>
                <Image className="w-4 h-4 mr-2" />
                Refresh Missing Covers
              </>
            )}
          </Button>

          {coverEnrichmentResult && (
            <div className="mt-4 bg-slate-900/50 p-3 rounded text-sm">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Enrichment complete</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Updated: <span className="text-emerald-400 font-semibold">{coverEnrichmentResult.updated || 0}</span></div>
                <div>Failed: <span className="text-slate-500">{coverEnrichmentResult.failed || 0}</span></div>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-emerald-200/50">
            Searches Google Books API by ISBN, then title+author for books missing cover images.
          </p>
        </CardContent>
      </Card>

      {/* Author Enrichment Queue */}
      <Card className="border-purple-700/50 bg-gradient-to-br from-purple-900/20 to-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-100">
            <Users className="w-5 h-5 text-purple-400" />
            Author Enrichment Queue
            {stats?.pendingEnrichments ? (
              <Badge className="ml-2 bg-purple-600">{stats.pendingEnrichments} pending</Badge>
            ) : null}
          </CardTitle>
          <CardDescription className="text-purple-200/70">
            Process pending author bio and metadata enrichments from Wikipedia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleProcessEnrichmentQueue}
            disabled={loadingEnrichment}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loadingEnrichment ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Queue...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Process Enrichment Queue
              </>
            )}
          </Button>

          {enrichmentQueueStatus && (
            <div className="mt-4 bg-slate-900/50 p-3 rounded text-sm">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Queue processed</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Processed: <span className="text-purple-400 font-semibold">{enrichmentQueueStatus.processed || 0}</span></div>
                <div>Errors: <span className="text-slate-500">{enrichmentQueueStatus.errors || 0}</span></div>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-purple-200/50">
            Fetches author bios, birth/death years, and notable works from Wikipedia and other sources.
          </p>
        </CardContent>
      </Card>

      {/* Penguin Science Fiction Population */}
      <Card className="border-amber-700/50 bg-gradient-to-br from-amber-900/20 to-slate-800/50">
        <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-100">
            <span className="text-xl">🐧</span>
            Populate Penguin Science Fiction
          </CardTitle>
          <CardDescription className="text-amber-200/70">
            Add 16 official Penguin Science Fiction titles with covers from penguin.co.uk
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
            Data sourced from penguin.co.uk/series/PENGSCIFI with official cover art CDN links.
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
            Data sourced from store.gollancz.co.uk/collections/best-of-masterworks with official cover art.
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
