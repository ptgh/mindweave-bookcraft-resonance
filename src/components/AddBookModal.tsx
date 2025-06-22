import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import BookSearchInput from "./BookSearchInput";
import { BookSuggestion } from "@/services/googleBooksApi";

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (book: any) => void;
  editingBook?: any;
}

const conceptualTags = [
  // Temporal Themes
  "Block Universe Compatible",
  "Time Dilation",
  "Chrono Loops",
  "Technological Shamanism",
  
  // World Structures
  "Utopian Collapse",
  "Mega-Corporate Systems",
  "Off-Earth Civilisations",
  "Off-Earthascs",
  
  // Narrative Form
  "Nonlinear Structure",
  "Dream Logic",
  "Archive-Based",
  "Memory Distortion",
  
  // Philosophy
  "Sebi-friendly",
  "Aurelius-aligned",
  "McLuhan-esque",
  "Metis-driven"
];

const personalResonanceOptions = [
  { key: "truth", label: "Felt like truth" },
  { key: "confirmed", label: "Confirmed a knowing" },
  { key: "disrupted", label: "Disrupted my thinking" },
  { key: "rewired", label: "Rewired my perspective" }
];

const AddBookModal = ({ isOpen, onClose, onAdd, editingBook }: AddBookModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    status: "want-to-read",
    tags: [] as string[],
    notes: "",
    cover_url: "", // Changed from coverUrl to cover_url to match database schema
    rating: {
      truth: false,
      confirmed: false,
      disrupted: false,
      rewired: false
    }
  });

  const [titleSearch, setTitleSearch] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");

  useEffect(() => {
    if (editingBook) {
      setFormData({
        title: editingBook.title || "",
        author: editingBook.author || "",
        status: editingBook.status || "want-to-read",
        tags: editingBook.tags || [],
        notes: editingBook.notes || "",
        cover_url: editingBook.cover_url || "", // Changed from coverUrl to cover_url
        rating: {
          truth: editingBook.rating?.truth || false,
          confirmed: editingBook.rating?.confirmed || false,
          disrupted: editingBook.rating?.disrupted || false,
          rewired: editingBook.rating?.rewired || false
        }
      });
      setTitleSearch(editingBook.title || "");
      setAuthorSearch(editingBook.author || "");
    } else {
      setFormData({
        title: "",
        author: "",
        status: "want-to-read",
        tags: [],
        notes: "",
        cover_url: "", // Changed from coverUrl to cover_url
        rating: {
          truth: false,
          confirmed: false,
          disrupted: false,
          rewired: false
        }
      });
      setTitleSearch("");
      setAuthorSearch("");
    }
  }, [editingBook, isOpen]);

  const handleBookSelect = (book: BookSuggestion) => {
    console.log('Selected book with coverUrl:', book.coverUrl); // Debug log
    setFormData(prev => ({
      ...prev,
      title: book.title,
      author: book.author,
      cover_url: book.coverUrl || "" // Changed from coverUrl to cover_url
    }));
    setTitleSearch(book.title);
    setAuthorSearch(book.author);
  };

  const toggleTag = (tag: string) => {
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
      return; // Don't allow more than 2 selections
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
    console.log('Submitting form data:', formData); // Debug log
    onAdd(formData);
    onClose();
  };

  if (!isOpen) return null;

  const selectedResonanceCount = Object.values(formData.rating).filter(Boolean).length;

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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className="text-slate-300 text-sm">Title</Label>
              <BookSearchInput
                placeholder="Search for a book title..."
                value={titleSearch}
                onValueChange={(value) => {
                  setTitleSearch(value);
                  setFormData(prev => ({ ...prev, title: value }));
                }}
                onBookSelect={handleBookSelect}
              />
            </div>
            <div>
              <Label htmlFor="author" className="text-slate-300 text-sm">Author</Label>
              <Input
                value={authorSearch}
                onChange={(e) => {
                  setAuthorSearch(e.target.value);
                  setFormData(prev => ({ ...prev, author: e.target.value }));
                }}
                className="bg-slate-700 border-slate-600 text-slate-200"
                placeholder="Author name"
                required
              />
            </div>
          </div>

          {formData.cover_url && (
            <div className="flex justify-center">
              <img 
                src={formData.cover_url} 
                alt={formData.title}
                className="w-20 h-28 object-cover rounded shadow-lg"
              />
            </div>
          )}
          
          <div>
            <Label className="text-slate-300 text-sm">Status</Label>
            <div className="flex space-x-4 mt-2">
              {[
                { value: "want-to-read", label: "Want to Read" },
                { value: "reading", label: "Reading" },
                { value: "read", label: "Read" }
              ].map(status => (
                <label key={status.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={formData.status === status.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="text-blue-400"
                  />
                  <span className="text-slate-300 text-sm">{status.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-slate-300 text-sm mb-3 block">Conceptual Tags</Label>
            <div className="grid grid-cols-2 gap-2">
              {conceptualTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-2 rounded-full text-xs transition-colors ${
                    formData.tags.includes(tag)
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-slate-300 text-sm mb-3 block">
              Personal Resonance 
              <span className="text-slate-500 ml-2">(max 2)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {personalResonanceOptions.map(option => (
                <label key={option.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.rating[option.key as keyof typeof formData.rating]}
                    onChange={(e) => handleResonanceChange(option.key, e.target.checked)}
                    disabled={!formData.rating[option.key as keyof typeof formData.rating] && selectedResonanceCount >= 2}
                    className="text-blue-400"
                  />
                  <span className={`text-sm ${
                    !formData.rating[option.key as keyof typeof formData.rating] && selectedResonanceCount >= 2 
                      ? 'text-slate-500' 
                      : 'text-slate-300'
                  }`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes" className="text-slate-300 text-sm">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-slate-200 mt-1 min-h-[100px]"
              placeholder="Connections, insights, influences..."
            />
          </div>
          
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
