import { useState } from 'react';
import { Send, ChevronRight } from 'lucide-react';

interface MissionChoiceButtonsProps {
  choices: string[];
  onChoose: (choice: string) => void;
  disabled?: boolean;
}

const MissionChoiceButtons = ({ choices, onChoose, disabled }: MissionChoiceButtonsProps) => {
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="space-y-2 mt-3">
      {choices.map((choice, i) => (
        <button
          key={i}
          onClick={() => onChoose(choice)}
          disabled={disabled}
          className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/60 border border-violet-500/20 hover:border-violet-400/50 hover:bg-violet-500/10 text-slate-200 text-sm transition-all disabled:opacity-30 group flex items-center gap-3"
        >
          <ChevronRight className="w-4 h-4 text-violet-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          <span>{choice}</span>
        </button>
      ))}

      {!showCustom ? (
        <button
          onClick={() => setShowCustom(true)}
          disabled={disabled}
          className="w-full text-center px-4 py-2 rounded-xl border border-dashed border-slate-600 text-slate-500 text-xs hover:text-slate-300 hover:border-slate-400 transition-all disabled:opacity-30"
        >
          Do something else...
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customInput.trim()) {
                onChoose(customInput.trim());
                setCustomInput('');
                setShowCustom(false);
              }
            }}
            placeholder="Describe your action..."
            className="flex-1 h-9 bg-slate-800 border border-slate-600 rounded-lg px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
            autoFocus
            disabled={disabled}
          />
          <button
            onClick={() => {
              if (customInput.trim()) {
                onChoose(customInput.trim());
                setCustomInput('');
                setShowCustom(false);
              }
            }}
            disabled={!customInput.trim() || disabled}
            className="h-9 w-9 flex items-center justify-center bg-violet-500/20 border border-violet-500/30 text-violet-400 rounded-lg hover:bg-violet-500/30 disabled:opacity-30 transition-all flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MissionChoiceButtons;
