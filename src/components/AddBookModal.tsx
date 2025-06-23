import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookSearchSection from "./BookForm/BookSearchSection";
import StatusSection from "./BookForm/StatusSection";
import ConceptualTagsSection from "./BookForm/ConceptualTagsSection";
import PersonalResonanceSection from "./BookForm/PersonalResonanceSection";
import NotesSection from "./BookForm/NotesSection";
import PublisherResonanceBadge from "./PublisherResonanceBadge";
import { BookSuggestion } from "@/services/googleBooksApi";
import { findMatchingPublisherSeries, PublisherSeries } from "@/services/publisherService";

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (book: any) => void;
  editingBook?: any;
}

const AddBookModal = ({ isOpen, onClose, onAdd, editingBook }: AddBookModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    status: "want-to-read",
    tags: [] as string[],
    notes: "",
    cover_url: "",
    rating: {
      truth: false,
      confirmed: false,
      disrupted: false,
      rewired: false
    },
    publisher_series_id: undefined as string | undefined
  });

  const [titleSearch, setTitleSearch] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");
  const [detectedSeries, setDetectedSeries] = useState<PublisherSeries | null>(null);

  useEffect(() => {
    if (editingBook) {
      setFormData({
        title: editingBook.title || "",
        author: editingBook.author || "",
        status: editingBook.status || "want-to-read",
        tags: editingBook.tags || [],
        notes: editingBook.notes || "",
        cover_url: editingBook.cover_url || "",
        rating: {
          truth: editingBook.rating?.truth || false,
          confirmed: editingBook.rating?.confirmed || false,
          disrupted: editingBook.rating?.disrupted || false,
          rewired: editingBook.rating?.rewired || false
        },
        publisher_series_id: editingBook.publisher_series_id
      });
      setTitleSearch(editingBook.title || "");
      setAuthorSearch(editingBook.author || "");
      if (editingBook.publisher_series) {
        setDetectedSeries(editingBook.publisher_series);
      }
    } else {
      setFormData({
        title: "",
        author: "",
        status: "want-to-read",
        tags: [],
        notes: "",
        cover_url: "",
        rating: {
          truth: false,
          confirmed: false,
          disrupted: false,
          rewired: false
        },
        publisher_series_id: undefined
      });
      setTitleSearch("");
      setAuthorSearch("");
      setDetectedSeries(null);
    }
  }, [editingBook, isOpen]);

  // Auto-detect publisher series when title/author changes
  useEffect(() => {
    const detectPublisherSeries = async () => {
      if (formData.title && formData.author && !editingBook) {
        try {
          const series = await findMatchingPublisherSeries(formData.title, formData.author);
          if (series) {
            setDetectedSeries(series);
            setFormData(prev => ({ ...prev, publisher_series_id: series.id }));
          } else {
            setDetectedSeries(null);
            setFormData(prev => ({ ...prev, publisher_series_id: undefined }));
          }
        } catch (error) {
          console.error('Error detecting publisher series:', error);
        }
      }
    };

    const timeoutId = setTimeout(detectPublisherSeries, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.title, formData.author, editingBook]);

  const handleBookSelect = (book: BookSuggestion) => {
    console.log('Selected book:', book);
    console.log('Book author:', book.author);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      title: book.title,
      author: book.author,
      cover_url: book.coverUrl || ""
    }));
    
    // Update search fields to keep them in sync
    setTitleSearch(book.title);
    setAuthorSearch(book.author);
  };

  const handleAuthorSelect = (author: any) => {
    console.log('Selected author:', author);
    setFormData(prev => ({
      ...prev,
      author: author.name
    }));
    setAuthorSearch(author.name);
  };

  const handleTitleSearchChange = (value: string) => {
    setTitleSearch(value);
    setFormData(prev => ({ ...prev, title: value }));
  };

  const handleAuthorSearchChange = (value: string) => {
    setAuthorSearch(value);
    setFormData(prev => ({ ...prev, author: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleResonanceChange = (key: string, checked: boolean) => {
    const selectedCount = Object.values(formData.rating).filter(Boolean).length;
    
    if (checked && selectedCount >= 2) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      rating: {
        ...prev.rating,
        [key]: checked
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    onAdd(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-slate-200 text-lg font-medium">
            {editingBook ? "Edit Signal" : "Log Signal"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <BookSearchSection
            titleSearch={titleSearch}
            authorSearch={authorSearch}
            coverUrl={formData.cover_url}
            title={formData.title}
            onTitleSearchChange={handleTitleSearchChange}
            onAuthorSearchChange={handleAuthorSearchChange}
            onBookSelect={handleBookSelect}
            onAuthorSelect={handleAuthorSelect}
          />
          
          {detectedSeries && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-purple-300 text-sm font-medium">Publisher Resonance Detected</span>
              </div>
              <PublisherResonanceBadge series={detectedSeries} />
              <p className="text-slate-400 text-xs mt-2">{detectedSeries.description}</p>
            </div>
          )}
          
          <StatusSection
            status={formData.status}
            onStatusChange={(status) => setFormData(prev => ({ ...prev, status }))}
          />
          
          <ConceptualTagsSection
            selectedTags={formData.tags}
            onTagToggle={handleTagToggle}
          />
          
          <PersonalResonanceSection
            rating={formData.rating}
            onResonanceChange={handleResonanceChange}
          />
          
          <NotesSection
            notes={formData.notes}
            onNotesChange={(notes) => setFormData(prev => ({ ...prev, notes }))}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingBook ? "Update Signal" : "Log Signal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookModal;
