
import { useState } from "react";
import Header from "@/components/Header";
import SignalInFocus from "@/components/SignalInFocus";
import BookCard from "@/components/BookCard";
import AddBookModal from "@/components/AddBookModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [currentSignal] = useState({
    title: "Signal Detected",
    author: "Awaiting Transmission"
  });

  const { toast } = useToast();

  const addBook = (newBook: any) => {
    if (editingBook) {
      // Update existing book
      setBooks(prev => prev.map(book => 
        book.id === editingBook.id ? { ...newBook, id: editingBook.id } : book
      ));
      toast({
        title: "Signal Updated",
        description: "Your transmission has been successfully modified.",
      });
    } else {
      // Add new book
      setBooks(prev => [...prev, { ...newBook, id: Date.now() }]);
      toast({
        title: "Signal Logged",
        description: "New transmission added to your consciousness record.",
      });
    }
    setEditingBook(null);
  };

  const handleEditBook = (book: any) => {
    setEditingBook(book);
    setIsAddModalOpen(true);
  };

  const handleKeepBook = (book: any) => {
    toast({
      title: "Signal Archived",
      description: `"${book.title}" has been marked for retention.`,
    });
  };

  const handleDiscardBook = (book: any) => {
    setBooks(prev => prev.filter(b => b.id !== book.id));
    toast({
      title: "Signal Discarded",
      description: `"${book.title}" has been removed from your transmissions.`,
    });
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingBook(null);
  };

  return (
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
              coverUrl={book.coverUrl}
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
