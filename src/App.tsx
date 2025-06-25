
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Discovery from "./pages/Discovery";
import ThreadMap from "./pages/ThreadMap";
import AuthorMatrix from "./pages/AuthorMatrix";
import Search from "./pages/Search";
import BookBrowser from "./pages/BookBrowser";
import PublisherResonance from "./pages/PublisherResonance";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import TestBrain from "./pages/TestBrain";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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

  // If user is not authenticated, show auth page, contact page (public), and test-brain (for demo)
  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/test-brain" element={<TestBrain />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // If user is authenticated, show all routes
  return (
    <Routes>
      <Route path="/" element={<Discovery />} />
      <Route path="/library" element={<Index />} />
      <Route path="/thread-map" element={<ThreadMap />} />
      <Route path="/author-matrix" element={<AuthorMatrix />} />
      <Route path="/search" element={<Search />} />
      <Route path="/book-browser" element={<BookBrowser />} />
      <Route path="/publisher-resonance" element={<PublisherResonance />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/test-brain" element={<TestBrain />} />
      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
