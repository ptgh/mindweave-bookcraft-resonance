import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useEnhancedToast } from "@/hooks/use-enhanced-toast";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { hasRole, loading } = useProfile();
  const navigate = useNavigate();
  const { toast } = useEnhancedToast();

  useEffect(() => {
    if (!loading && !hasRole('admin')) {
      toast({
        title: "Access Denied",
        description: "Administrator privileges required to access this page.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [hasRole, loading, navigate, toast]);

  if (loading) {
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

  if (!hasRole('admin')) {
    return null;
  }

  return <>{children}</>;
};
