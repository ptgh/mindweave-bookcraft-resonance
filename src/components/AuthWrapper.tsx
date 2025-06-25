
import { useAuth } from "@/hooks/useAuth";

interface AuthWrapperProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

const AuthWrapper = ({ children, fallback }: AuthWrapperProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
          </div>
          <p className="text-slate-400">Establishing connection...</p>
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
