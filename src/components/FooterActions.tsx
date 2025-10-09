import { Mail } from "lucide-react";
import { StandardButton } from "./ui/standard-button";
import ContributionButton from "./ContributionButton";

interface FooterActionsProps {
  onContactClick: () => void;
}

export const FooterActions = ({ onContactClick }: FooterActionsProps) => {
  return (
    <footer className="text-center">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>Quantum resonance stabilized</span>
          <span aria-hidden="true">•</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <StandardButton
            onClick={onContactClick}
            variant="standard"
            size="xs"
            className="inline-flex items-center justify-center gap-1 w-36 truncate focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none"
          >
            <Mail className="w-3 h-3" />
            <span>Make Contact</span>
          </StandardButton>
          <ContributionButton walletAddress="0xDd966928cC8EA2e61221170490D696BD224866bf" />
        </div>
      </div>
    </footer>
  );
};
