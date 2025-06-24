
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
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
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link to complete your registration.",
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
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-slate-200 focus:border-cyan-400"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-200 focus:border-cyan-400 pr-10"
                    required
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    minLength={isSignUp ? 6 : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white touch-manipulation active:scale-95 transition-transform"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isSignUp ? "Creating Account..." : "Signing In..."}</span>
                  </div>
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setPassword("");
                }}
                className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors touch-manipulation"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Need an account? Create one"
                }
              </button>
            </div>

            {isSignUp && (
              <div className="mt-4 text-xs text-slate-500 text-center">
                By creating an account, you agree to receive essential communications about your account.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span>Secure authentication</span>
            <div className="w-1 h-1 bg-slate-600 rounded-full" />
            <span>Apple Password compatible</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
