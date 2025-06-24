
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
import Auth from "./pages/Auth";
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

  return (
    <Routes>
      <Route path="/" element={user ? <Discovery /> : <Navigate to="/auth" replace />} />
      <Route path="/library" element={user ? <Index /> : <Navigate to="/auth" replace />} />
      <Route path="/thread-map" element={user ? <ThreadMap /> : <Navigate to="/auth" replace />} />
      <Route path="/author-matrix" element={user ? <AuthorMatrix /> : <Navigate to="/auth" replace />} />
      <Route path="/search" element={user ? <Search /> : <Navigate to="/auth" replace />} />
      <Route path="/book-browser" element={user ? <BookBrowser /> : <Navigate to="/auth" replace />} />
      <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" replace />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
