
import { Label } from "@/components/ui/label";

interface PersonalResonanceSectionProps {
  rating: {
    truth: boolean;
    confirmed: boolean;
    disrupted: boolean;
    rewired: boolean;
  };
  onResonanceChange: (key: string, checked: boolean) => void;
}

const personalResonanceOptions = [
  { key: "truth", label: "Felt like truth" },
  { key: "confirmed", label: "Confirmed a knowing" },
  { key: "disrupted", label: "Disrupted my thinking" },
  { key: "rewired", label: "Rewired my perspective" }
];

const PersonalResonanceSection = ({ rating, onResonanceChange }: PersonalResonanceSectionProps) => {
  const selectedResonanceCount = Object.values(rating).filter(Boolean).length;

  return (
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
              checked={rating[option.key as keyof typeof rating]}
              onChange={(e) => onResonanceChange(option.key, e.target.checked)}
              disabled={!rating[option.key as keyof typeof rating] && selectedResonanceCount >= 2}
              className="text-blue-400"
            />
            <span className={`text-sm ${
              !rating[option.key as keyof typeof rating] && selectedResonanceCount >= 2 
                ? 'text-slate-500' 
                : 'text-slate-300'
            }`}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default PersonalResonanceSection;
