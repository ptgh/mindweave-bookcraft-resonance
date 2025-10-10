import { useState } from "react";
import { Heart, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StandardButton } from "@/components/ui/standard-button";
import { useResponsive } from "@/hooks/useResponsive";

interface ContributionButtonProps {
  walletAddress: string;
  className?: string;
}

const ContributionButton = ({ walletAddress, className = "" }: ContributionButtonProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { isMobile } = useResponsive();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: "Address Copied",
        description: "Ethereum wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please copy the address manually",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`group relative ${className}`}>
      <StandardButton
        onClick={copyToClipboard}
        variant="standard"
        size="xs"
        className={`inline-flex items-center justify-center gap-1 truncate focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none ${isMobile ? 'w-auto px-2' : 'w-44'}`}
        aria-label="Support Development"
      >
        <Heart className="w-3 h-3 text-red-400" />
        <span>Support Development</span>
        {copied ? (
          <Check className="w-3 h-3 text-green-400" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </StandardButton>
      
      <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 whitespace-nowrap shadow-lg z-10">
        <div className="mb-1 text-slate-400">Ethereum Address:</div>
        <div className="font-mono text-xs break-all">{walletAddress}</div>
        <div className="text-slate-500 text-xs mt-1">Click to copy</div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-700"></div>
      </div>
    </div>
  );
};

export default ContributionButton;