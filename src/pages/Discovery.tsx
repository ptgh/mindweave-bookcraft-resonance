
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, BookOpen, Users, Search, Map, Eye } from "lucide-react";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";

const Discovery = () => {
  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main ref={mainContainerRef} className="container mx-auto px-6 py-12">
          <div ref={addFeatureBlockRef} className="feature-block text-center mb-16">
            <h1 ref={heroTitleRef} className="text-4xl font-light text-slate-200 mb-4 tracking-wide">
              <span className="text-blue-400">LEAFNODE</span>
            </h1>
            <p className="text-sm text-slate-400 mb-2">for the future-literate</p>
            
            <div className="flex items-center justify-center space-x-2 mb-8">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-4">
              Mapping the narrative threads of consciousness
            </p>
            <p className="text-sm text-slate-500">
              Signal strength: Rising • Frequency: 432 Hz
            </p>
          </div>

          <div ref={addFeatureBlockRef} className="feature-block grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link 
              to="/library" 
              className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-medium text-slate-200">Transmissions</h2>
              </div>
              <p className="text-slate-400 leading-relaxed text-sm">
                Your saved signal archive
              </p>
            </Link>

            <Link 
              to="/book-browser" 
              className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Search className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-medium text-slate-200">Book Browser</h2>
              </div>
              <p className="text-slate-400 leading-relaxed text-sm">
                Discover new sci-fi signals
              </p>
            </Link>

            <Link 
              to="/author-matrix" 
              className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-medium text-slate-200">Author Matrix</h2>
              </div>
              <p className="text-slate-400 leading-relaxed text-sm">
                Explore author consciousness maps
              </p>
            </Link>

            <Link 
              to="/thread-map" 
              className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Map className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-medium text-slate-200">Chrono Thread</h2>
              </div>
              <p className="text-slate-400 leading-relaxed text-sm">
                Timeline consciousness map
              </p>
            </Link>
          </div>

          <div ref={addFeatureBlockRef} className="feature-block text-center mt-16">
            <div className="flex items-center justify-center space-x-4 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Neural pathways: Initializing</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Consciousness Record: Standby</span>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default Discovery;
