
import { useState } from "react";
import Header from "@/components/Header";
import SignalInFocus from "@/components/SignalInFocus";
import BookCard from "@/components/BookCard";
import AddBookModal from "@/components/AddBookModal";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [books, setBooks] = useState([
    {
      id: 1,
      title: "Dune",
      author: "Frank Herbert",
      status: "read" as const,
      tags: ["Block Universe Compatible", "Off-Earth Civilisations", "Future Politics"],
      rating: { shifted: true, truth: true }
    },
    {
      id: 2,
      title: "Dhalgren",
      author: "Samuel R. Delany",
      status: "reading" as const,
      tags: ["Temporal Distortion", "Nonlinear Narrative", "Urban Decay"],
      rating: { dissonant: true, shifted: true }
    },
    {
      id: 3,
      title: "I, Robot",
      author: "Isaac Asimov",
      status: "read" as const,
      tags: ["AI Ethics", "Three Laws", "Technological Shamanism"],
      rating: { truth: true, confirmed: true }
    },
    {
      id: 4,
      title: "Altered Carbon",
      author: "Richard K. Morgan",
      status: "reading" as const,
      tags: ["Memory Distortion", "Digital Consciousness", "Sebi-friendly"],
      rating: { shifted: true, truth: true }
    },
    {
      id: 5,
      title: "The Stars My Destination",
      author: "Alfred Bester",
      status: "read" as const,
      tags: ["Jaunting", "Revenge Arc", "Psychological Evolution"],
      rating: { dissonant: true, shifted: true }
    },
    {
      id: 6,
      title: "Do Androids Dream of Electric Sheep?",
      author: "Philip K. Dick",
      status: "read" as const,
      tags: ["Mega-Corporate Systems", "Dream Logic", "Empathy Machine"],
      rating: { truth: true, confirmed: true }
    }
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentSignal] = useState({
    title: "Dune",
    author: "Frank Herbert"
  });

  const addBook = (newBook: any) => {
    setBooks(prev => [...prev, { ...newBook, id: Date.now() }]);
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
              title={book.title}
              author={book.author}
              status={book.status}
              tags={book.tags}
              rating={book.rating}
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
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addBook}
      />
    </div>
  );
};

export default Index;
