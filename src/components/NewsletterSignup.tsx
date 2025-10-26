import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long")
});

export const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const validation = emailSchema.safeParse({ email: email.trim() });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('newsletter-subscribe', {
        body: { email: email.trim() }
      });

      if (error) throw error;

      setIsSuccess(true);
      setEmail("");
      toast.success("Sync confirmed! Check your inbox.");
      
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error: any) {
      console.error('Newsletter signup error:', error);
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        toast.error("Already in the network");
      } else {
        toast.error("Sync failed. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 text-cyan-400 text-sm">
        <Mail className="w-4 h-4" />
        <span className="font-light">Signal received</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-sm">
      <div className="relative flex-1">
        <Input
          type="email"
          placeholder="Enter signal coordinates"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-slate-800/30 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50 focus:bg-slate-800/50 transition-all text-sm h-9 pr-24"
          required
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={isLoading}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-3 min-w-fit bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-200 text-xs"
        >
          {isLoading ? "..." : "Sync"}
        </Button>
      </div>
    </form>
  );
};
