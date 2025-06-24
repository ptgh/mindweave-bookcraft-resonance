
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";

const Discovery = () => {
  const { user, signOut } = useAuth();
  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div ref={mainContainerRef} className="text-center max-w-2xl w-full">
        <div className="mb-8">
          <h1 
            ref={heroTitleRef}
            className="text-3xl sm:text-4xl font-light text-slate-200 mb-2 tracking-wider"
          >
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
          
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 px-4">
            Mapping the narrative threads of consciousness
          </p>
          
          <div className="text-slate-500 text-xs mb-8">
            Signal strength: Rising • Frequency: 432 Hz
          </div>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid gap-4 mb-8">
          <div ref={addFeatureBlockRef} className="feature-block">
            <Link to="/library" className="focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg">
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-6 hover:bg-slate-700/40 transition-all duration-200 hover:border-slate-600/50 focus:outline-none">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                </div>
                <h3 className="text-slate-200 font-medium mb-2">Transmissions</h3>
                <p className="text-slate-400 text-sm">Your saved signal archive</p>
              </div>
            </Link>
          </div>
          
          <div ref={addFeatureBlockRef} className="feature-block">
            <Link to="/author-matrix" className="focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg">
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-6 hover:bg-slate-700/40 transition-all duration-200 hover:border-slate-600/50 focus:outline-none">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                </div>
                <h3 className="text-slate-200 font-medium mb-2">Author Matrix</h3>
                <p className="text-slate-400 text-sm">Navigate consciousness territories</p>
              </div>
            </Link>
          </div>
          
          <div ref={addFeatureBlockRef} className="feature-block">
            <Link to="/thread-map" className="focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg">
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-6 hover:bg-slate-700/40 transition-all duration-200 hover:border-slate-600/50 focus:outline-none">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                </div>
                <h3 className="text-slate-200 font-medium mb-2">Chrono Thread</h3>
                <p className="text-slate-400 text-sm">Timeline consciousness map</p>
              </div>
            </Link>
          </div>
          
          <div ref={addFeatureBlockRef} className="feature-block bg-slate-800/20 border border-slate-700/30 rounded-lg p-6 opacity-50">
            <div className="flex items-center justify-center mb-3">
              <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
            </div>
            <h3 className="text-slate-300 font-medium mb-2">Publisher Resonance</h3>
            <p className="text-slate-500 text-sm">Curated collections • Coming Soon</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div ref={addFeatureBlockRef} className="feature-block">
            <Link to="/author-matrix" className="focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg">
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-6 hover:bg-slate-700/40 transition-all duration-200 hover:border-slate-600/50 focus:outline-none">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <h3 className="text-slate-200 font-medium mb-2">Search</h3>
                <p className="text-slate-400 text-sm">Discover new signals</p>
              </div>
            </Link>
          </div>
          
          <div ref={addFeatureBlockRef} className="feature-block">
            <Link to="/book-browser" className="focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg">
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-6 hover:bg-slate-700/40 transition-all duration-200 hover:border-slate-600/50 focus:outline-none">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                </div>
                <h3 className="text-slate-200 font-medium mb-2">Book Browser</h3>
                <p className="text-slate-400 text-sm">Visual discovery portal</p>
              </div>
            </Link>
          </div>
        </div>

        {user && (
          <div className="mb-6">
            <Button 
              onClick={signOut}
              variant="outline" 
              className="cta-button border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Sign Out
            </Button>
          </div>
        )}

        <div className="text-center">
          <div className="inline-flex flex-wrap items-center justify-center space-x-2 text-slate-500 text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Neural pathways: Active</span>
            <div className="w-1 h-1 bg-slate-600 rounded-full" />
            <span>Consciousness Record: Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discovery;
