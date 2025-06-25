import { useState, useEffect, useCallback } from "react";
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

const Index = () => {
  const [books, setBooks] = useState<Transmission[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Transmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSignal] = useState({
    title: "Signal Detected",
    author: "Awaiting Transmission"
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();

  const loadTransmissions = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const transmissions = await getTransmissions();
      setBooks(transmissions);
    } catch (error: any) {
      console.error('Failed to load transmissions:', error);
      toast({
        title: "Signal Error",
        description: "Failed to load transmissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
      loadTransmissions();
    } else {
      setLoading(false);
    }
  }, [user, loadTransmissions]);

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
      console.error('Error saving transmission:', error);
      toast({
        title: "Transmission Error",
        description: "Failed to save transmission. Please try again.",
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

  return (
    <AuthWrapper fallback={<Auth />}>
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
            
            <StandardButton
              onClick={() => setIsAddModalOpen(true)}
              variant="standard"
              className="touch-manipulation active:scale-95"
            >
              + Log Signal
            </StandardButton>
          </div>
          
          <div ref={addFeatureBlockRef} className="feature-block">
            <TransmissionsList
              transmissions={books}
              loading={loading}
              onEdit={handleEditBook}
              onKeep={handleKeepBook}
              onDiscard={handleDiscardBook}
              onAddNew={() => setIsAddModalOpen(true)}
            />
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
    </AuthWrapper>
  );
};

export default Index;
