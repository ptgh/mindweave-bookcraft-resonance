
import { useAuthContext } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface AuthWrapperProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

const AuthWrapper = ({ children, fallback }: AuthWrapperProps) => {
  const { user, loading, error } = useAuthContext();

  // Redirect to auth page if there's a persistent error
  useEffect(() => {
    if (error && !loading) {
      console.error('Auth error in wrapper:', error);
      // Only redirect if we're not already on the auth page
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
  }, [error, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
          </div>
          <p className="text-slate-400">Establishing connection...</p>
          {error && (
            <p className="text-red-400 text-sm mt-2">
              Authentication error detected. Redirecting...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default AuthWrapper;
