
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (book: any) => void;
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

const AddBookModal = ({ isOpen, onClose, onAdd }: AddBookModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    status: "want-to-read",
    tags: [] as string[],
    notes: "",
    rating: {
      shifted: false,
      confirmed: false,
      truth: false,
      dissonant: false
    }
  });

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
    setFormData({
      title: "",
      author: "",
      status: "want-to-read",
      tags: [],
      notes: "",
      rating: {
        shifted: false,
        confirmed: false,
        truth: false,
        dissonant: false
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-slate-200 text-lg font-medium">Log Signal</h2>
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
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-slate-200 mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="author" className="text-slate-300 text-sm">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-slate-200 mt-1"
                required
              />
            </div>
          </div>
          
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
            <Label className="text-slate-300 text-sm mb-3 block">Personal Resonance</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "shifted", label: "Shifted me" },
                { key: "confirmed", label: "Confirmed me" },
                { key: "truth", label: "Felt like truth" },
                { key: "dissonant", label: "Dissonant brilliance" }
              ].map(rating => (
                <label key={rating.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.rating[rating.key as keyof typeof formData.rating]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rating: {
                        ...prev.rating,
                        [rating.key]: e.target.checked
                      }
                    }))}
                    className="text-blue-400"
                  />
                  <span className="text-slate-300 text-sm">{rating.label}</span>
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
              Log Signal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookModal;
