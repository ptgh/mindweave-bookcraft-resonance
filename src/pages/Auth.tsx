
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { cleanupAuthState, forceSignOut } from "@/utils/authCleanup";
import AuthForm from "@/components/AuthForm";
import EmailConfirmationView from "@/components/EmailConfirmationView";
import StatusIndicator from "@/components/StatusIndicator";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const { user, error: authError, clearError } = useAuthContext();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      console.log('User authenticated, redirecting to home...');
      window.location.href = '/';
    }
  }, [user]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      toast({
        title: "Authentication Error",
        description: authError,
        variant: "destructive",
      });
    }
  }, [authError, toast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      if (isSignUp) {
        // Clean up any existing auth state before signing up
        await forceSignOut(supabase);
        
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
          });
        } else if (data.session) {
          // User was signed up and immediately signed in
          toast({
            title: "Account created successfully",
            description: "Welcome! You've been signed in automatically.",
          });
          window.location.href = '/';
        }
      } else {
        // Clean up any existing auth state before signing in
        await forceSignOut(supabase);
        
        const { data, error } = await supabase.auth.signInWithPassword({
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
            setEmailSent(true);
          } else {
            throw error;
          }
        } else if (data.session) {
          toast({
            title: "Welcome back!",
            description: "You've been signed in successfully.",
          });
          window.location.href = '/';
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred. Please try again.",
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
    clearError();
  };

  const handleBack = () => {
    setEmailSent(false);
    setIsSignUp(false);
    clearError();
  };

  const handleForceReset = async () => {
    try {
      await forceSignOut(supabase);
      cleanupAuthState();
      toast({
        title: "Authentication Reset",
        description: "Your authentication state has been cleared. Please try signing in again.",
      });
      setEmailSent(false);
      setIsSignUp(false);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error('Error during force reset:', error);
    }
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-cyan-400 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-cyan-400 animate-pulse" />
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
            
            {/* Emergency reset button for stuck auth states */}
            <div className="mt-4 text-center">
              <button
                onClick={handleForceReset}
                className="text-red-400 hover:text-red-300 text-xs transition-colors"
              >
                Having trouble? Reset authentication state
              </button>
            </div>
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
