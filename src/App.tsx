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
const BookToScreen = lazy(() => import("./pages/BookToScreen"));
const Protagonists = lazy(() => import("./pages/Protagonists"));
const AdminEnrichment = lazy(() => import("./pages/AdminEnrichment"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const ProtagonistApp = lazy(() => import("./pages/ProtagonistApp"));

const NotFound = lazy(() => import("./pages/NotFound"));
const ShareBook = lazy(() => import("./pages/ShareBook"));

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

  // All main read-only routes are accessible to everyone.
  // Auth-gated routes (admin, insights) redirect unauthenticated users to /auth.
  return (
    <>
      <Suspense fallback={SuspenseFallback}>
        <Routes>
          {/* Public routes — accessible to all visitors */}
          <Route path="/" element={<Discovery />} />
          <Route path="/library" element={<Index />} />
          <Route path="/thread-map" element={<Navigate to="/book-browser" replace />} />
          <Route path="/author-matrix" element={<AuthorMatrix />} />
          <Route path="/search" element={<Search />} />
          <Route path="/book-browser" element={<BookBrowser />} />
          <Route path="/publisher-resonance" element={<PublisherResonance />} />
          <Route path="/test-brain" element={<TestBrain />} />
          <Route path="/community" element={<Community />} />
          <Route path="/protagonists" element={<Protagonists />} />
          <Route path="/book-to-screen" element={<BookToScreen />} />
          <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
          <Route path="/protagonist-app" element={<ProtagonistApp />} />
          <Route path="/share/book/:id" element={<ShareBook />} />

          {/* Auth-gated routes */}
          <Route path="/insights" element={user ? <ReadingInsights /> : <Navigate to="/auth" replace />} />
          <Route path="/admin/enrichment" element={user ? <AdminEnrichment /> : <Navigate to="/auth" replace />} />
          <Route path="/admin/populate" element={<Navigate to="/admin/enrichment" replace />} />

          {/* Auth page — redirect home if already signed in */}
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {/* Global floating AI assistant */}
      <ErrorBoundary fallback={null}>
        <FloatingNeuralAssistant />
      </ErrorBoundary>
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
