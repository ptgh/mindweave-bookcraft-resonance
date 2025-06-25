
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // If user is not authenticated and trying to access a protected route
    // redirect them to auth instead of showing 404
    if (!loading && !user && location.pathname !== '/auth') {
      console.log('Redirecting unauthenticated user to auth page');
      navigate('/auth');
    }
  }, [location.pathname, user, loading, navigate]);

  // Don't show 404 if we're still loading auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-blue-400 animate-pulse" />
          </div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-red-500/30 bg-red-500/10 flex items-center justify-center">
          <span className="text-2xl">🔍</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-slate-200">404</h1>
        <p className="text-xl text-slate-400 mb-4">Oops! Page not found</p>
        <p className="text-sm text-slate-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="space-y-2">
          <Button
            onClick={() => navigate('/')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white mr-2"
          >
            Return to Home
          </Button>
          
          {!user && (
            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Sign In
            </Button>
          )}
        </div>
        
        <div className="mt-8 text-xs text-slate-500">
          Path: {location.pathname}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
