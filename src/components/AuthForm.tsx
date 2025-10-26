
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/LoadingSpinner";

interface AuthFormProps {
  isSignUp: boolean;
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  subscribeNewsletter?: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onNewsletterChange?: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleMode: () => void;
}

const AuthForm = ({
  isSignUp,
  email,
  password,
  showPassword,
  loading,
  subscribeNewsletter = true,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onNewsletterChange,
  onSubmit,
  onToggleMode
}: AuthFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="bg-slate-700 border-slate-600 text-slate-200 focus:border-cyan-400"
          required
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          data-testid="email-input"
          // Enhanced Apple Passwords support
          name="email"
          id="email"
        />
      </div>
      
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="bg-slate-700 border-slate-600 text-slate-200 focus:border-cyan-400 pr-10"
            required
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={isSignUp ? 6 : undefined}
            data-testid="password-input"
            // Enhanced Apple Passwords support
            name="password"
            id="password"
            // Additional attributes for better password manager integration
            data-1p-ignore={showPassword ? "true" : undefined}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isSignUp && onNewsletterChange && (
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="newsletter"
            checked={subscribeNewsletter}
            onChange={(e) => onNewsletterChange(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-800"
          />
          <label htmlFor="newsletter" className="text-sm text-slate-300 cursor-pointer">
            Join weekly transmissions (curated sci-fi insights & reading lists)
          </label>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white touch-manipulation active:scale-95 transition-transform"
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="sm" />
            <span>{isSignUp ? "Creating Account..." : "Signing In..."}</span>
          </div>
        ) : (
          isSignUp ? "Create Account" : "Sign In"
        )}
      </Button>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onToggleMode}
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
          <br />
          <span className="text-slate-400 mt-1 block">
            A confirmation email will be sent to verify your address.
          </span>
        </div>
      )}
    </form>
  );
};

export default AuthForm;
