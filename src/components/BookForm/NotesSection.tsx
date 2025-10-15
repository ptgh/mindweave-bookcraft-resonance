
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface NotesSectionProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

const NotesSection = ({ notes, onNotesChange }: NotesSectionProps) => {
  return (
    <div>
      <Label htmlFor="notes" className="text-slate-300 text-sm">Notes</Label>
      <Textarea
        id="notes"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        className="bg-slate-700 border-slate-600 text-slate-200 mt-1 min-h-[100px] resize-none overflow-hidden"
        placeholder="Connections, insights, influences..."
      />
    </div>
  );
};

export default NotesSection;
