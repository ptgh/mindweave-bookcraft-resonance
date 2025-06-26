
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StandardButton } from "@/components/ui/standard-button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Call the edge function to handle the contact form submission
      const { data, error } = await supabase.functions.invoke('contact-form', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Signal transmitted",
        description: "Your message has been received. We'll respond to your transmission soon.",
      });

      setFormData({ name: "", email: "", message: "" });
      onClose();
    } catch (error: any) {
      console.error('Contact form error:', error);
      toast({
        title: "Transmission failed",
        description: error.message || "Unable to send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-slate-200 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-dashed border-blue-400 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
            </div>
            Initiate Contact
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="bg-slate-700 border-slate-600 text-slate-200 focus:border-blue-400"
              placeholder="Your name"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="off"
              value={formData.email}
              onChange={handleChange}
              className="bg-slate-700 border-slate-600 text-slate-200 focus:border-blue-400"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
              Message
            </label>
            <Textarea
              id="message"
              name="message"
              required
              rows={4}
              value={formData.message}
              onChange={handleChange}
              className="bg-slate-700 border-slate-600 text-slate-200 focus:border-blue-400 resize-none"
              placeholder="Your message..."
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <StandardButton
              type="button"
              onClick={onClose}
              variant="ghost"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </StandardButton>
            <StandardButton
              type="submit"
              variant="standard"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Transmitting..." : "Send Signal"}
            </StandardButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;
