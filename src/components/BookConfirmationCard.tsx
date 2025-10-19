import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, X } from 'lucide-react';
import { CONCEPTUAL_TAGS } from '@/constants/conceptualTags';

interface BookData {
  title: string;
  author: string;
  status: "reading" | "read" | "want-to-read";
  sentiment: string;
  suggestedTags: string[];
  clarificationQuestions?: string[];
  needsClarification?: boolean;
  notes?: string;
}

interface BookConfirmationCardProps {
  bookData: BookData;
  onConfirm: (editedData: BookData) => void;
  onCancel: () => void;
  onAnswer?: (answer: string) => void;
}

export const BookConfirmationCard: React.FC<BookConfirmationCardProps> = ({
  bookData,
  onConfirm,
  onCancel,
  onAnswer
}) => {
  const [title, setTitle] = useState(bookData.title);
  const [author, setAuthor] = useState(bookData.author);
  const [status, setStatus] = useState<"reading" | "read" | "want-to-read">(bookData.status);
  const [selectedTags, setSelectedTags] = useState<string[]>(bookData.suggestedTags || []);
  const [notes, setNotes] = useState(bookData.notes || '');
  const [clarificationAnswer, setClarificationAnswer] = useState('');

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleConfirm = () => {
    onConfirm({
      title,
      author,
      status,
      sentiment: bookData.sentiment,
      suggestedTags: selectedTags,
      notes
    });
  };

  const handleSendAnswer = () => {
    if (clarificationAnswer.trim() && onAnswer) {
      onAnswer(clarificationAnswer);
      setClarificationAnswer('');
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto bg-slate-900/98 border-cyan-400/30 shadow-2xl shadow-cyan-400/20 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-700/50 bg-slate-800/60 py-3 px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <CardTitle className="text-slate-200 text-base">Book Detected</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/20 h-7 w-7"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-slate-300 text-xs">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-800/50 border-slate-700/50 text-slate-200 focus:border-cyan-400/50 h-9 text-sm"
          />
        </div>

        {/* Author */}
        <div className="space-y-1.5">
          <Label htmlFor="author" className="text-slate-300 text-xs">Author</Label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="bg-slate-800/50 border-slate-700/50 text-slate-200 focus:border-cyan-400/50 h-9 text-sm"
          />
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label className="text-slate-300 text-xs">Reading Status</Label>
          <Select value={status} onValueChange={(value: any) => setStatus(value)}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-200 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="reading">Currently Reading</SelectItem>
              <SelectItem value="want-to-read">Want to Read</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sentiment Badge */}
        {bookData.sentiment && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/40 border border-slate-700/50 rounded-md">
            <span className="text-slate-400 text-[10px]">Detected sentiment:</span>
            <span className={`text-[10px] font-medium ${
              bookData.sentiment === 'positive' ? 'text-green-400' :
              bookData.sentiment === 'negative' ? 'text-red-400' :
              bookData.sentiment === 'mixed' ? 'text-yellow-400' :
              'text-slate-400'
            }`}>
              {bookData.sentiment}
            </span>
          </div>
        )}

        {/* Conceptual Nodes */}
        {bookData.suggestedTags.length > 0 && (
          <div className="space-y-2">
            <Label className="text-slate-300 text-xs">Conceptual Nodes</Label>
            <div className="flex flex-wrap gap-1.5">
              {bookData.suggestedTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-[10px] transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/50"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-slate-300 text-xs">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Connections, insights, influences..."
            className="bg-slate-800/50 border-slate-700/50 text-slate-200 focus:border-cyan-400/50 min-h-[80px] resize-none text-sm"
          />
        </div>


        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-slate-700/30">
          <Button
            onClick={handleConfirm}
            disabled={!title.trim() || !author.trim()}
            size="sm"
            className="flex-1 bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-400 border border-cyan-400/50 h-9 text-xs"
          >
            + Log Signal
          </Button>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/20 h-9 text-xs"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
