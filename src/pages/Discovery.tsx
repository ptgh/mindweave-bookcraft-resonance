
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Discovery = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-slate-200 mb-2 tracking-wider">
            LEAFNODE
          </h1>
          <p className="text-slate-400 text-sm mb-6 font-light">
            for the future-literate
          </p>
          
          {/* Three dots indicator */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <div className="w-2 h-2 bg-slate-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
          </div>
          
          <p className="text-slate-300 text-lg leading-relaxed mb-8">
            Mapping the narrative threads of consciousness
          </p>
          
          <div className="text-slate-500 text-xs mb-8">
            Signal strength: Rising • Frequency: 432 Hz
          </div>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid gap-4 mb-8">
          <Link to="/library">
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-6 hover:bg-slate-700/40 transition-all duration-200 hover:border-slate-600/50">
              <div className="flex items-center justify-center mb-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              </div>
              <h3 className="text-slate-200 font-medium mb-2">Transmissions</h3>
              <p className="text-slate-400 text-sm">Your saved signal archive</p>
            </div>
          </Link>
          
          <Link to="/publisher-resonance">
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-6 hover:bg-slate-700/40 transition-all duration-200 hover:border-slate-600/50">
              <div className="flex items-center justify-center mb-3">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              </div>
              <h3 className="text-slate-200 font-medium mb-2">Publisher Resonance</h3>
              <p className="text-slate-400 text-sm">Curated collections from premier publishers</p>
            </div>
          </Link>
          
          <div className="bg-slate-800/20 border border-slate-700/30 rounded-lg p-6 opacity-50">
            <div className="flex items-center justify-center mb-3">
              <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
            </div>
            <h3 className="text-slate-300 font-medium mb-2">Search</h3>
            <p className="text-slate-500 text-sm">Discover new signals • Coming Soon</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800/20 border border-slate-700/30 rounded-lg p-6 opacity-50">
            <div className="flex items-center justify-center mb-3">
              <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
            </div>
            <h3 className="text-slate-300 font-medium mb-2">Classification</h3>
            <p className="text-slate-500 text-sm">Tag and categorize • Coming Soon</p>
          </div>
          
          <div className="bg-slate-800/20 border border-slate-700/30 rounded-lg p-6 opacity-50">
            <div className="flex items-center justify-center mb-3">
              <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
            </div>
            <h3 className="text-slate-300 font-medium mb-2">Chrono Thread</h3>
            <p className="text-slate-500 text-sm">Timeline consciousness map • Coming Soon</p>
          </div>
        </div>

        {user && (
          <div className="mb-6">
            <Button 
              onClick={signOut}
              variant="outline" 
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              Sign Out
            </Button>
          </div>
        )}

        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Neural pathways: Initializing</span>
            <div className="w-1 h-1 bg-slate-600 rounded-full" />
            <span>Consciousness Record: Standby</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discovery;
