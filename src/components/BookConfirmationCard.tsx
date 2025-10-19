import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, X, Plus } from 'lucide-react';
import { CONCEPTUAL_TAGS } from '@/constants/conceptualTags';

interface BookData {
  title: string;
  author: string;
  status: "reading" | "read" | "want-to-read";
  sentiment: string;
  suggestedTags: string[];
  clarificationQuestions?: string[];
  needsClarification?: boolean;
}

interface BookConfirmationCardProps {
  bookData: BookData;
  onConfirm: (editedData: BookData & { customTags: string[] }) => void;
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
  const [customTag, setCustomTag] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [clarificationAnswer, setClarificationAnswer] = useState('');

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !customTags.includes(customTag.trim())) {
      setCustomTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleRemoveCustomTag = (tag: string) => {
    setCustomTags(prev => prev.filter(t => t !== tag));
  };

  const handleConfirm = () => {
    onConfirm({
      title,
      author,
      status,
      sentiment: bookData.sentiment,
      suggestedTags: selectedTags,
      customTags
    });
  };

  const handleSendAnswer = () => {
    if (clarificationAnswer.trim() && onAnswer) {
      onAnswer(clarificationAnswer);
      setClarificationAnswer('');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-slate-900/95 border-cyan-400/20 shadow-2xl shadow-cyan-400/10">
      <CardHeader className="border-b border-slate-700/50 bg-slate-800/40">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-slate-200 text-lg">Book Detected</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-slate-300 text-sm">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-800/50 border-slate-700/50 text-slate-200 focus:border-cyan-400/50"
          />
        </div>

        {/* Author */}
        <div className="space-y-2">
          <Label htmlFor="author" className="text-slate-300 text-sm">Author</Label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="bg-slate-800/50 border-slate-700/50 text-slate-200 focus:border-cyan-400/50"
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-slate-300 text-sm">Reading Status</Label>
          <Select value={status} onValueChange={(value: any) => setStatus(value)}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-200">
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
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg">
            <span className="text-slate-400 text-xs">Detected sentiment:</span>
            <span className={`text-xs font-medium ${
              bookData.sentiment === 'positive' ? 'text-green-400' :
              bookData.sentiment === 'negative' ? 'text-red-400' :
              bookData.sentiment === 'mixed' ? 'text-yellow-400' :
              'text-slate-400'
            }`}>
              {bookData.sentiment}
            </span>
          </div>
        )}

        {/* Suggested Tags */}
        {bookData.suggestedTags.length > 0 && (
          <div className="space-y-3">
            <Label className="text-slate-300 text-sm">Suggested Conceptual Tags</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bookData.suggestedTags.map(tag => (
                <div
                  key={tag}
                  className="flex items-center space-x-2 p-2 bg-slate-800/40 border border-slate-700/50 rounded-md hover:bg-slate-800/60 transition-colors"
                >
                  <Checkbox
                    id={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => handleToggleTag(tag)}
                    className="border-cyan-400/50 data-[state=checked]:bg-cyan-400 data-[state=checked]:border-cyan-400"
                  />
                  <label
                    htmlFor={tag}
                    className="text-sm text-slate-300 cursor-pointer flex-1"
                  >
                    {tag}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Tags */}
        <div className="space-y-3">
          <Label className="text-slate-300 text-sm">Add Custom Tags (Optional)</Label>
          <div className="flex gap-2">
            <Input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
              placeholder="Add a custom tag..."
              className="bg-slate-800/50 border-slate-700/50 text-slate-200 focus:border-cyan-400/50"
            />
            <Button
              onClick={handleAddCustomTag}
              variant="outline"
              size="icon"
              className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {customTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customTags.map(tag => (
                <div
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded text-cyan-400 text-xs"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveCustomTag(tag)}
                    className="hover:text-cyan-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clarification Questions */}
        {bookData.needsClarification && bookData.clarificationQuestions && bookData.clarificationQuestions.length > 0 && (
          <div className="space-y-3 border-t border-slate-700/50 pt-6">
            <Label className="text-slate-300 text-sm">Help us refine your tags:</Label>
            {bookData.clarificationQuestions.map((question, idx) => (
              <p key={idx} className="text-slate-400 text-sm italic">{question}</p>
            ))}
            <Textarea
              value={clarificationAnswer}
              onChange={(e) => setClarificationAnswer(e.target.value)}
              placeholder="Your answer will help us suggest better tags..."
              className="bg-slate-800/50 border-slate-700/50 text-slate-200 focus:border-cyan-400/50 min-h-[80px]"
            />
            <Button
              onClick={handleSendAnswer}
              disabled={!clarificationAnswer.trim()}
              variant="outline"
              className="w-full border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
            >
              Send Answer
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleConfirm}
            disabled={!title.trim() || !author.trim()}
            className="flex-1 bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-400 border border-cyan-400/50"
          >
            Add to Library
          </Button>
          <Button
            onClick={onCancel}
            variant="ghost"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/20"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
