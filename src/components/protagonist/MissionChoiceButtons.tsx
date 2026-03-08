import { useState } from 'react';

interface MissionChoiceButtonsProps {
  choices: string[];
  onChoose: (choice: string) => void;
  disabled?: boolean;
}

/**
 * Renders mission suggestions as subtle inline hints, not big buttons.
 * The user can tap a suggestion to auto-fill or just type naturally.
 */
const MissionChoiceButtons = ({ choices, onChoose, disabled }: MissionChoiceButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {choices.map((choice, i) => (
        <button
          key={i}
          onClick={() => onChoose(choice)}
          disabled={disabled}
          className="px-2.5 py-1 rounded-full bg-violet-500/8 border border-violet-500/15 text-violet-300/70 text-[11px] hover:bg-violet-500/15 hover:text-violet-200 hover:border-violet-400/30 transition-all disabled:opacity-30"
        >
          {choice}
        </button>
      ))}
    </div>
  );
};

export default MissionChoiceButtons;
