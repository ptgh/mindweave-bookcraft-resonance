import { ReactNode, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: profileLoading, userRole } = useProfile();
  const navigate = useNavigate();
  const { toast } = useEnhancedToast();
  const hasShownToast = useRef(false);

  // Combined loading state
  const isLoading = authLoading || profileLoading;

  useEffect(() => {
    // Don't do anything while still loading
    if (isLoading) return;
    
    // If no user at all, redirect to auth
    if (!user) {
      navigate('/auth');
      return;
    }

    // If user exists but not admin, show error and redirect
    if (!hasRole('admin') && !hasShownToast.current) {
      hasShownToast.current = true;
      toast({
        title: "Access Denied",
        description: "Administrator privileges required to access this page.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [user, hasRole, isLoading, navigate, toast]);

  // Reset toast flag when component unmounts or user changes
  useEffect(() => {
    return () => {
      hasShownToast.current = false;
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full border-2 border-dashed border-blue-400/30 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-spin border-t-transparent" />
          </div>
          <p className="text-slate-400 text-sm">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting non-admins
  if (!user || !hasRole('admin')) {
    return null;
  }

  return <>{children}</>;
};
