
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Discovery = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-blue-400/30 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-blue-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-slate-200 mb-4">
            Consciousness Library
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Map your intellectual journey through the books that shape your mind. 
            Track resonance, capture insights, and discover patterns in your reading frequency.
          </p>
        </div>

        <div className="space-y-4">
          {user ? (
            <div className="space-y-4">
              <p className="text-slate-300">Welcome back, signal operator</p>
              <div className="flex gap-4 justify-center">
                <Link to="/library">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                    Access Library
                  </Button>
                </Link>
                <Button 
                  onClick={signOut}
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 px-8 py-3"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Link to="/library">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  Begin Transmission
                </Button>
              </Link>
              <p className="text-slate-500 text-sm">
                Start logging your reading signals and build your consciousness map
              </p>
            </div>
          )}
        </div>

        <div className="mt-12">
          <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span>Frequency: 432 Hz</span>
            <div className="w-1 h-1 bg-slate-600 rounded-full" />
            <span>Signal detection: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discovery;
