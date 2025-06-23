
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Discovery from "./pages/Discovery";
import ThreadMap from "./pages/ThreadMap";
import PublisherResonance from "./pages/PublisherResonance";
import AuthorMatrix from "./pages/AuthorMatrix";
import Auth from "./pages/Auth";
import Test from "./pages/Test";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Discovery />} />
          <Route path="/library" element={<Index />} />
          <Route path="/thread-map" element={<ThreadMap />} />
          <Route path="/publisher-resonance" element={<PublisherResonance />} />
          <Route path="/author-matrix" element={<AuthorMatrix />} />
          <Route path="/test" element={<Test />} />
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
