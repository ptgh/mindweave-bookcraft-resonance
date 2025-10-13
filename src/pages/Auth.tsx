
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";
import AuthForm from "@/components/AuthForm";
import EmailConfirmationView from "@/components/EmailConfirmationView";
import StatusIndicator from "@/components/StatusIndicator";
import AnimatedLeafnodeLogo from "@/components/AnimatedLeafnodeLogo";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useEnhancedToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try signing in instead.",
              variant: "destructive",
            });
            setIsSignUp(false);
          } else {
            throw error;
          }
        } else if (data.user && !data.session) {
          setEmailSent(true);
          toast({
            title: "Confirmation email sent",
            description: "Please check your email and click the confirmation link to complete your registration.",
            variant: "success"
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password and try again.",
              variant: "destructive",
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: "Email not confirmed",
              description: "Please check your email and click the confirmation link before signing in.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      toast({
        title: "Confirmation email resent",
        description: "Please check your email for the new confirmation link.",
        variant: "success"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setPassword("");
    setEmailSent(false);
  };

  const handleBack = () => {
    setEmailSent(false);
    setIsSignUp(false);
  };

  if (emailSent) {
    return (
      <EmailConfirmationView
        email={email}
        onResend={handleResendConfirmation}
        onBack={handleBack}
      />
    );
  }

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
            <CardTitle className="text-slate-200">
              {isSignUp ? "Create Account" : "Sign In"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isSignUp 
                ? "Join the consciousness network" 
                : "Access your literary transmissions"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm
              isSignUp={isSignUp}
              email={email}
              password={password}
              showPassword={showPassword}
              loading={loading}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onSubmit={handleAuth}
              onToggleMode={handleToggleMode}
            />
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 text-slate-500 text-xs">
            <StatusIndicator status="active" label="Secure authentication" />
            <div className="w-1 h-1 bg-slate-600 rounded-full" />
            <StatusIndicator status="active" label="Apple Passwords compatible" />
            <div className="w-1 h-1 bg-slate-600 rounded-full" />
            <StatusIndicator status="active" label="Email confirmation enabled" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
