
import { Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AuthWrapperProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
      <p className="text-slate-400 text-sm">Initializing...</p>
    </div>
  </div>
);

const AuthWrapper = ({ children, fallback }: AuthWrapperProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Suspense fallback={<LoadingSpinner />}>{fallback}</Suspense>;
  }

  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
};

export default AuthWrapper;
