
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import SignalInFocus from "@/components/SignalInFocus";
import AddBookModal from "@/components/AddBookModal";
import AuthWrapper from "@/components/AuthWrapper";
import TransmissionsList from "@/components/TransmissionsList";
import Auth from "./Auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getTransmissions, saveTransmission, updateTransmission, deleteTransmission, Transmission } from "@/services/transmissionsService";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";

const Index = () => {
  const [books, setBooks] = useState<Transmission[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Transmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSignal] = useState({
    title: "Signal Detected",
    author: "Awaiting Transmission"
  });

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();

  const loadTransmissions = useCallback(async () => {
    if (!user) {
      setLoading(false);
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
      console.error('Load transmissions error:', error);
      setError(error.message);
      toast({
        title: "Signal Error",
        description: "Failed to load transmissions: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      loadTransmissions();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, loadTransmissions]);

  const addBook = useCallback(async (newBook: any) => {
    try {
      if (editingBook) {
        await updateTransmission(editingBook.id, newBook);
        toast({
          title: "Signal Updated",
          description: "Your transmission has been successfully modified.",
        });
      } else {
        await saveTransmission(newBook);
        toast({
          title: "Signal Logged",
          description: "New transmission added to your consciousness record.",
        });
      }
      await loadTransmissions();
      setEditingBook(null);
    } catch (error: any) {
      toast({
        title: "Transmission Error",
        description: error.message,
        variant: "destructive",
      });
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
      await deleteTransmission(book.id);
      await loadTransmissions();
      toast({
        title: "Signal Discarded",
        description: `"${book.title}" has been removed from your transmissions.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast, loadTransmissions]);

  const closeModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingBook(null);
  }, []);

  // Show loading while auth is loading
  if (authLoading) {
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

  // Show auth if no user
  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main ref={mainContainerRef} className="container mx-auto px-6 py-8">
        <div ref={addFeatureBlockRef} className="feature-block">
          <SignalInFocus book={currentSignal} />
        </div>
        
        <div ref={addFeatureBlockRef} className="feature-block flex items-center justify-between mb-6">
          <div>
            <h2 ref={heroTitleRef} className="text-slate-200 text-xl font-medium mb-1">Transmissions</h2>
            <p className="text-slate-400 text-sm">Your reading frequency across time and space</p>
          </div>
          
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="cta-button bg-blue-600 hover:bg-blue-700 text-white touch-manipulation active:scale-95"
          >
            + Log Signal
          </Button>
        </div>
        
        <div ref={addFeatureBlockRef} className="feature-block">
          {error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-red-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-red-400" />
              </div>
              <h3 className="text-red-400 text-lg font-medium mb-2">Connection Error</h3>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
              <Button
                onClick={() => loadTransmissions()}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Retry Connection
              </Button>
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
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span>Tuning frequency: 432 Hz</span>
            <div className="w-1 h-1 bg-slate-600 rounded-full" />
            <span>Signal strength: Rising</span>
          </div>
        </div>
      </main>
      
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={closeModal}
        onAdd={addBook}
        editingBook={editingBook}
      />
    </div>
  );
};

export default Index;
