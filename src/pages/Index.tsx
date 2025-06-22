import { useState, useEffect } from "react";
import Header from "@/components/Header";
import SignalInFocus from "@/components/SignalInFocus";
import BookCard from "@/components/BookCard";
import AddBookModal from "@/components/AddBookModal";
import PublisherResonanceModal from "@/components/PublisherResonanceModal";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { getTransmissions, saveTransmission, updateTransmission, deleteTransmission, Transmission } from "@/services/transmissionsService";
import { getPublisherSeries, PublisherSeries, PublisherBook } from "@/services/publisherService";

const Index = () => {
  const [books, setBooks] = useState<Transmission[]>([]);
  const [publisherSeries, setPublisherSeries] = useState<PublisherSeries[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPublisherModalOpen, setIsPublisherModalOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<PublisherSeries | null>(null);
  const [editingBook, setEditingBook] = useState<Transmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSignal] = useState({
    title: "Signal Detected",
    author: "Awaiting Transmission"
  });

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTransmissions();
      loadPublisherSeries();
    }
  }, [user]);

  const loadTransmissions = async () => {
    try {
      setLoading(true);
      const transmissions = await getTransmissions();
      setBooks(transmissions);
    } catch (error: any) {
      toast({
        title: "Signal Error",
        description: "Failed to load transmissions: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPublisherSeries = async () => {
    try {
      const series = await getPublisherSeries();
      setPublisherSeries(series);
    } catch (error: any) {
      console.error('Failed to load publisher series:', error);
    }
  };

  const addBook = async (newBook: any) => {
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
  };

  const handleAddFromPublisher = (book: PublisherBook) => {
    const newBook = {
      title: book.title,
      author: book.author,
      cover_url: book.cover_url || "",
      status: "want-to-read",
      tags: [],
      notes: book.editorial_note || "",
      rating: {
        truth: false,
        confirmed: false,
        disrupted: false,
        rewired: false
      },
      publisher_series_id: book.series_id
    };
    
    addBook(newBook);
    setIsPublisherModalOpen(false);
  };

  const handleEditBook = (book: Transmission) => {
    setEditingBook(book);
    setIsAddModalOpen(true);
  };

  const handleKeepBook = (book: Transmission) => {
    toast({
      title: "Signal Archived",
      description: `"${book.title}" has been marked for retention.`,
    });
  };

  const handleDiscardBook = async (book: Transmission) => {
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
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingBook(null);
  };

  const openPublisherModal = (series: PublisherSeries) => {
    setSelectedSeries(series);
    setIsPublisherModalOpen(true);
  };

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <SignalInFocus book={currentSignal} />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-slate-200 text-xl font-medium mb-1">Transmissions</h2>
              <p className="text-slate-400 text-sm">Your reading frequency across time and space</p>
            </div>
            
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              + Log Signal
            </Button>
          </div>

          {/* Publisher Resonance Section */}
          {publisherSeries.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-slate-200 text-lg font-medium mb-1">Publisher Resonance</h3>
                  <p className="text-slate-400 text-sm">Discover curated threads from premier publishers</p>
                </div>
                <Link to="/publisher-resonance">
                  <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                    Explore All Threads
                  </Button>
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                {publisherSeries.slice(0, 3).map((series) => (
                  <div 
                    key={series.id}
                    onClick={() => openPublisherModal(series)}
                    className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 hover:bg-purple-500/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{series.badge_emoji}</span>
                      <span className="text-purple-300 text-sm font-medium">{series.name}</span>
                    </div>
                    <p className="text-slate-400 text-xs">{series.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
              </div>
              <p className="text-slate-400">Loading transmissions...</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {books.map(book => (
                  <BookCard
                    key={book.id}
                    id={book.id}
                    title={book.title}
                    author={book.author}
                    status={book.status}
                    tags={book.tags}
                    rating={book.rating}
                    coverUrl={book.cover_url}
                    publisher_series={book.publisher_series}
                    onEdit={() => handleEditBook(book)}
                    onKeep={() => handleKeepBook(book)}
                    onDiscard={() => handleDiscardBook(book)}
                  />
                ))}
              </div>
              
              {books.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
                  </div>
                  <h3 className="text-slate-300 text-lg font-medium mb-2">No signals yet</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Begin mapping your intellectual journey through the books that shape you
                  </p>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Log Your First Signal
                  </Button>
                </div>
              )}
            </>
          )}
          
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

        {selectedSeries && (
          <PublisherResonanceModal
            isOpen={isPublisherModalOpen}
            onClose={() => setIsPublisherModalOpen(false)}
            series={selectedSeries}
            onAddBook={handleAddFromPublisher}
          />
        )}
      </div>
    </AuthWrapper>
  );
};

export default Index;
