import { Suspense, lazy, useEffect } from "react";
import { EnhancedToaster } from "@/components/ui/enhanced-toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipToContent } from "@/components/SkipToContent";
import { WebsiteStructuredData } from "@/components/StructuredData";
import { FloatingNeuralAssistant } from "@/components/FloatingNeuralAssistant";
// Lazy load route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Discovery = lazy(() => import("./pages/Discovery"));
const AuthorMatrix = lazy(() => import("./pages/AuthorMatrix"));
const ReadingInsights = lazy(() => import("./pages/ReadingInsights"));
const Search = lazy(() => import("./pages/Search"));
const BookBrowser = lazy(() => import("./pages/BookBrowser"));
const PublisherResonance = lazy(() => import("./pages/PublisherResonance"));
const Auth = lazy(() => import("./pages/Auth"));
const TestBrain = lazy(() => import("./pages/TestBrain"));
const Community = lazy(() => import("./pages/Community"));
const AdminEnrichment = lazy(() => import("./pages/AdminEnrichment"));
const AdminPopulate = lazy(() => import("./pages/AdminPopulate"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));

const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Scroll restoration component
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
          </div>
          <p className="text-slate-400">Establishing connection...</p>
        </div>
      </div>
    );
  }

  // Loading fallback for lazy-loaded components
  const SuspenseFallback = (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
        </div>
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );

  // If user is not authenticated, show auth page and test-brain (for demo)
  if (!user) {
    return (
      <Suspense fallback={SuspenseFallback}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/test-brain" element={<TestBrain />} />
          <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // If user is authenticated, show all routes including test-brain
  return (
    <>
      <Suspense fallback={SuspenseFallback}>
        <Routes>
          <Route path="/" element={<Discovery />} />
          <Route path="/library" element={<Index />} />
          <Route path="/thread-map" element={<Navigate to="/book-browser" replace />} />
          <Route path="/insights" element={<ReadingInsights />} />
          <Route path="/author-matrix" element={<AuthorMatrix />} />
          <Route path="/search" element={<Search />} />
          <Route path="/book-browser" element={<BookBrowser />} />
          <Route path="/publisher-resonance" element={<PublisherResonance />} />
          
          <Route path="/test-brain" element={<TestBrain />} />
          <Route path="/community" element={<Community />} />
          <Route path="/admin/enrichment" element={<AdminEnrichment />} />
          <Route path="/admin/populate" element={<AdminPopulate />} />
          <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <FloatingNeuralAssistant />
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SkipToContent />
        <WebsiteStructuredData
          name="Leafnode"
          description="Track, discover, and explore science fiction literature with AI-powered insights"
          url={typeof window !== 'undefined' ? window.location.origin : 'https://leafnode.lovable.app'}
        />
        <EnhancedToaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
