
import { useState } from "react";
import { Mail, MessageSquare, Send, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StandardButton } from "@/components/ui/standard-button";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { sendContactMessage, ContactFormData } from "@/services/contactService";

const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await sendContactMessage(formData);

    if (result.success) {
      setSent(true);
      toast({
        title: "Message Sent",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again or email us directly.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-400/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-light text-slate-200 mb-4">Message Transmitted</h1>
            <p className="text-slate-400 mb-8">Your signal has been received. We'll respond to your transmission soon.</p>
            <StandardButton
              onClick={() => setSent(false)}
              variant="standard"
            >
              Send Another Message
            </StandardButton>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <MessageSquare className="w-8 h-8 text-cyan-400" />
              <h1 className="text-2xl sm:text-3xl font-light text-slate-200">Contact</h1>
            </div>
            <p className="text-slate-400">Establish connection • Transmit your signal</p>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center space-x-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                <span>Send Message</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Connect with us at <span className="text-cyan-400">connect@leafnode.co.uk</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">Name</label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-200 focus:border-cyan-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-200 focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Subject</label>
                  <Input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-200 focus:border-cyan-400"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Message</label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-200 focus:border-cyan-400 min-h-[120px]"
                    required
                  />
                </div>
                
                <StandardButton
                  type="submit"
                  variant="standard"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Signal</span>
                    </>
                  )}
                </StandardButton>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span>Direct link: connect@leafnode.co.uk</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
