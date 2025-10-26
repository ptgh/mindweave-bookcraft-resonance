import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import AnimatedLeafnodeLogo from "@/components/AnimatedLeafnodeLogo";

const Unsubscribe = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = async () => {
      if (!token) {
        setStatus('error');
        setMessage("Invalid unsubscribe link");
        return;
      }

      try {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({ 
            status: 'unsubscribed',
            unsubscribed_at: new Date().toISOString()
          })
          .eq('unsubscribe_token', token);

        if (error) throw error;

        setStatus('success');
        setMessage("Signal disconnected. You've been unsubscribed from our weekly transmissions.");
      } catch (error: any) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
        setMessage("Failed to unsubscribe. The link may be invalid or expired.");
      }
    };

    unsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AnimatedLeafnodeLogo />
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-slate-200 mb-2 tracking-wider">
            LEAFNODE
          </h1>
          <p className="text-slate-400 text-sm">
            for the future-literate
          </p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {status === 'loading' && (
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle2 className="w-12 h-12 text-cyan-400" />
              )}
              {status === 'error' && (
                <XCircle className="w-12 h-12 text-red-400" />
              )}
            </div>
            <CardTitle className="text-slate-200">
              {status === 'loading' && "Processing..."}
              {status === 'success' && "Unsubscribed"}
              {status === 'error' && "Error"}
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'success' && (
              <div className="text-center space-y-4">
                <p className="text-sm text-slate-400">
                  We're sorry to see you go. You won't receive any more weekly transmissions from us.
                </p>
                <p className="text-sm text-slate-500">
                  Changed your mind? You can resubscribe anytime from our website.
                </p>
              </div>
            )}
            
            <Button
              onClick={() => navigate('/')}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              Return to Leafnode
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Unsubscribe;
