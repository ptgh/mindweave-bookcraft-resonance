
import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { StandardButton } from "@/components/ui/standard-button";
import BookSearchSection from "./BookSearchSection";
import StatusSection from "./StatusSection";
import ConceptualTagsSection from "./ConceptualTagsSection";
import PersonalResonanceSection from "./PersonalResonanceSection";
import NotesSection from "./NotesSection";
import PublisherResonanceBadge from "../PublisherResonanceBadge";
import { BookSuggestion } from "@/services/googleBooksApi";
import { findMatchingPublisherSeries, PublisherSeries } from "@/services/publisherService";
import { transmissionSchema } from "@/utils/validation";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface BookFormData {
  title: string;
  author: string;
  status: string;
  tags: string[];
  notes: string;
  cover_url: string;
  rating: {
    truth: boolean;
    confirmed: boolean;
    disrupted: boolean;
    rewired: boolean;
  };
  publisher_series_id?: string;
}

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (book: BookFormData) => void | Promise<void>;
  editingBook?: any;
}

const BookFormModal = ({ isOpen, onClose, onSubmit, editingBook }: BookFormModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<BookFormData>({
    title: "",
    author: "",
    status: "want-to-read",
    tags: [],
    notes: "",
    cover_url: "",
    rating: { truth: false, confirmed: false, disrupted: false, rewired: false },
    publisher_series_id: undefined
  });

  const [titleSearch, setTitleSearch] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");
  const [detectedSeries, setDetectedSeries] = useState<PublisherSeries | null>(null);
  const [selectedAuthorName, setSelectedAuthorName] = useState<string>("");

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      author: "",
      status: "want-to-read",
      tags: [],
      notes: "",
      cover_url: "",
      rating: { truth: false, confirmed: false, disrupted: false, rewired: false },
      publisher_series_id: undefined
    });
    setTitleSearch("");
    setAuthorSearch("");
    setDetectedSeries(null);
  }, []);

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
      resetForm();
    }
  }, [editingBook, isOpen, resetForm]);

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

  const handleBookSelect = useCallback((book: BookSuggestion) => {
    setFormData(prev => ({
      ...prev,
      title: book.title,
      author: book.author,
      cover_url: book.coverUrl || ""
    }));
    setTitleSearch(book.title);
    setAuthorSearch(book.author);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate using Zod schema
      transmissionSchema.parse({
        title: formData.title,
        author: formData.author,
        status: formData.status,
        tags: formData.tags,
        notes: formData.notes || undefined,
        cover_url: formData.cover_url || undefined,
        rating: formData.rating,
        publisher_series_id: formData.publisher_series_id,
      });

      await Promise.resolve(onSubmit(formData));
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Validation Error",
          description: `${firstError.path.join('.')}: ${firstError.message}`,
          variant: "destructive",
        });
      } else {
        console.error('BookForm submission failed:', error);
      }
      // Keep modal open so user can correct issues
    }
  }, [formData, onSubmit, onClose, toast]);

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
            className="text-slate-400 hover:text-slate-200 transition-colors touch-manipulation"
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
            onTitleSearchChange={(value) => {
              setTitleSearch(value);
              setFormData(prev => ({ ...prev, title: value }));
            }}
            onAuthorSearchChange={(value) => {
              setAuthorSearch(value);
              setFormData(prev => ({ ...prev, author: value }));
              // Clear selected author if user manually changes the field
              if (value !== selectedAuthorName) {
                setSelectedAuthorName("");
              }
            }}
            onBookSelect={handleBookSelect}
            onAuthorSelect={(author) => {
              setFormData(prev => ({ ...prev, author: author.name }));
              setAuthorSearch(author.name);
              setSelectedAuthorName(author.name); // Set the selected author for filtering
            }}
            selectedAuthorName={selectedAuthorName}
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
            onTagToggle={(tag) => setFormData(prev => ({
              ...prev,
              tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
            }))}
          />
          
          <PersonalResonanceSection
            rating={formData.rating}
            onResonanceChange={(key, checked) => {
              const selectedCount = Object.values(formData.rating).filter(Boolean).length;
              if (checked && selectedCount >= 2) return;
              
              setFormData(prev => ({
                ...prev,
                rating: { ...prev.rating, [key]: checked }
              }));
            }}
          />
          
          <NotesSection
            notes={formData.notes}
            onNotesChange={(notes) => setFormData(prev => ({ ...prev, notes }))}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <StandardButton
              type="button"
              variant="standard"
              onClick={onClose}
              className="touch-manipulation"
            >
              Cancel
            </StandardButton>
            <StandardButton
              type="submit"
              variant="standard"
              className="touch-manipulation active:scale-95"
            >
              {editingBook ? "Update Signal" : "Log Signal"}
            </StandardButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookFormModal;
