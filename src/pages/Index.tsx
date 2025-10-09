
import { useState, useEffect, useCallback, useMemo } from "react";
import { Mail, BookOpen, Search, Eye, Map, Circle, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import SignalInFocus from "@/components/SignalInFocus";
import AddBookModal from "@/components/AddBookModal";
import AuthWrapper from "@/components/AuthWrapper";
import TransmissionsList from "@/components/TransmissionsList";
import Auth from "./Auth";
import { StandardButton } from "@/components/ui/standard-button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getTransmissions, saveTransmission, updateTransmission, deleteTransmission, Transmission } from "@/services/transmissionsService";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import ContributionButton from "@/components/ContributionButton";
import ContactModal from "@/components/ContactModal";
import { searchAppleBooks } from "@/services/appleBooks";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [books, setBooks] = useState<Transmission[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Transmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  // Memoize static data to prevent unnecessary re-renders
  const currentSignal = useMemo(() => ({
    title: "Signal Detected",
    author: "Awaiting Transmission"
  }), []);

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();
  const navigate = useNavigate();

  const loadTransmissions = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping transmission load');
      setLoading(false);
      setError(null);
      return;
    }
    
    try {
      console.log('Loading transmissions for user:', user.email);
      setLoading(true);
      setError(null);
      
      const transmissions = await getTransmissions();
      console.log('Loaded transmissions:', transmissions.length);
      setBooks(transmissions);
    } catch (error: any) {
      console.error('Failed to load transmissions:', error);
      setError('Failed to load transmissions. Please check your connection and try again.');
      
      // Don't show toast if user is not authenticated
      if (user) {
        toast({
          title: "Connection Issue",
          description: "Unable to load your transmissions. Please refresh the page.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    console.log('Auth state changed - User:', user?.email, 'Auth loading:', authLoading);
    
    // Only proceed if auth is not loading
    if (!authLoading) {
      if (user) {
        loadTransmissions();
      } else {
        console.log('No authenticated user, setting loading to false');
        setLoading(false);
        setError(null);
      }
    }
  }, [user, authLoading, loadTransmissions]);

  const addBook = useCallback(async (newBook: any) => {
    try {
      setError(null);

      // Enrich with Apple Books link before saving (best-effort)
      const enriched = { ...newBook };
      try {
        const apple = await searchAppleBooks(newBook.title, newBook.author, newBook.isbn);
        if (apple?.storeUrl) {
          enriched.apple_link = apple.storeUrl;
        }
      } catch (e) {
        console.warn('Apple enrichment failed:', e);
      }

      if (editingBook) {
        await updateTransmission(editingBook.id, enriched);
        toast({
          title: "Signal Updated",
          description: "Your transmission has been successfully modified.",
        });
      } else {
        await saveTransmission(enriched);
        toast({
          title: "Signal Logged",
          description: "New transmission added to your consciousness record.",
        });
      }
      await loadTransmissions();
      setEditingBook(null);
    } catch (error: any) {
      console.error('Error saving transmission:', error);
      const message = (error?.message || '').toLowerCase();
      if (message.includes('user not authenticated')) {
        toast({
          title: "Sign in required",
          description: "Please sign in to log signals.",
          variant: "destructive",
        });
        navigate('/auth');
      } else {
        toast({
          title: "Transmission Error",
          description: "Failed to save transmission. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [editingBook, toast, loadTransmissions]);

  const handleEditBook = useCallback((book: Transmission) => {
    setEditingBook(book);
    setIsAddModalOpen(true);
  }, []);

  const handleKeepBook = useCallback((book: Transmission) => {
    toast({
      title: "Signal Archived",
      description: `"${book.title}" has been marked for retention.`,
    });
  }, [toast]);

  const handleDiscardBook = useCallback(async (book: Transmission) => {
    try {
      setError(null);
      await deleteTransmission(book.id);
      await loadTransmissions();
      toast({
        title: "Signal Discarded",
        description: `"${book.title}" has been removed from your transmissions.`,
      });
    } catch (error: any) {
      console.error('Error deleting transmission:', error);
      toast({
        title: "Error",
        description: "Failed to delete transmission. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, loadTransmissions]);

  const closeModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingBook(null);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    loadTransmissions();
  }, [loadTransmissions]);


  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main ref={mainContainerRef} className="container mx-auto px-4 sm:px-6 py-8">
          <div ref={addFeatureBlockRef} className="feature-block">
            <SignalInFocus book={currentSignal} />
          </div>
          
          {/* Navigation Cards */}
          <div ref={addFeatureBlockRef} className="feature-block mb-12">
            <h2 className="text-slate-300 text-lg font-medium mb-6 text-center">Mapping the narrative threads of consciousness</h2>
            <p className="text-slate-400 text-sm text-center mb-8">Signal strength: Rising • Frequency: 432 Hz</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <button
                onClick={() => navigate('/')}
                className="group relative overflow-hidden rounded-xl bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 p-6 text-left transition-all hover:bg-slate-800/60 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                    <BookOpen className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-200 font-medium text-lg mb-1">Transmissions</h3>
                    <p className="text-slate-400 text-sm">Your saved signal archive</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/discovery')}
                className="group relative overflow-hidden rounded-xl bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 p-6 text-left transition-all hover:bg-slate-800/60 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                    <Search className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-200 font-medium text-lg mb-1">Book Browser</h3>
                    <p className="text-slate-400 text-sm">Discover new sci-fi signals</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/author-matrix')}
                className="group relative overflow-hidden rounded-xl bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 p-6 text-left transition-all hover:bg-slate-800/60 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                    <Eye className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-200 font-medium text-lg mb-1">Author Matrix</h3>
                    <p className="text-slate-400 text-sm">Explore author consciousness maps</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/thread-map')}
                className="group relative overflow-hidden rounded-xl bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 p-6 text-left transition-all hover:bg-slate-800/60 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                    <Map className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-200 font-medium text-lg mb-1">Chrono Thread</h3>
                    <p className="text-slate-400 text-sm">Timeline consciousness map</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/publisher-resonance')}
                className="group relative overflow-hidden rounded-xl bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 p-6 text-left transition-all hover:bg-slate-800/60 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                    <Circle className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-200 font-medium text-lg mb-1">Publisher Resonance</h3>
                    <p className="text-slate-400 text-sm">Explore publisher consciousness</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/test-brain')}
                className="group relative overflow-hidden rounded-xl bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 p-6 text-left transition-all hover:bg-slate-800/60 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-200 font-medium text-lg mb-1">Neural Map</h3>
                    <p className="text-slate-400 text-sm">AI consciousness interface</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          
          <div ref={addFeatureBlockRef} className="feature-block flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex-1">
              <h2 ref={heroTitleRef} className="text-slate-200 text-xl font-medium mb-1">Transmissions</h2>
              <p className="text-slate-400 text-sm">Your reading frequency across time and space</p>
            </div>
            
            <StandardButton
              onClick={() => setIsAddModalOpen(true)}
              variant="standard"
              className="touch-manipulation active:scale-95 whitespace-nowrap"
            >
              + Log Signal
            </StandardButton>
          </div>
          
          <div ref={addFeatureBlockRef} className="feature-block">
            {error ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-red-600 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-red-500" />
                </div>
                <h3 className="text-red-400 text-lg mb-2">Signal Error</h3>
                <p className="text-slate-400 mb-4">{error}</p>
                <StandardButton onClick={handleRetry} variant="standard">
                  Try Again
                </StandardButton>
              </div>
            ) : (
              <TransmissionsList
                transmissions={books}
                loading={loading}
                onEdit={handleEditBook}
                onKeep={handleKeepBook}
                onDiscard={handleDiscardBook}
                onAddNew={() => setIsAddModalOpen(true)}
              />
            )}
          </div>
          
          <div className="mt-12 pb-8">
            <footer className="text-center">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Quantum resonance stabilized</span>
                  <span aria-hidden="true">•</span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <StandardButton
                    onClick={() => setShowContactModal(true)}
                    variant="standard"
                    size="xs"
                    className="inline-flex items-center justify-center gap-1 w-36 truncate focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Make Contact</span>
                  </StandardButton>
                  <ContributionButton 
                    walletAddress="0xDd966928cC8EA2e61221170490D696BD224866bf"
                    className="inline-block"
                  />
                </div>
              </div>
            </footer>
          </div>
        </main>
        
        <AddBookModal
          isOpen={isAddModalOpen}
          onClose={closeModal}
          onAdd={addBook}
          editingBook={editingBook}
        />

        <ContactModal 
          isOpen={showContactModal} 
          onClose={() => setShowContactModal(false)} 
        />
      </div>
    </AuthWrapper>
  );
};

export default Index;
