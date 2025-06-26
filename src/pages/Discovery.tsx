import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StandardButton } from "@/components/ui/standard-button";
import { Brain, BookOpen, Users, Search, Map, Eye, Building, Mail } from "lucide-react";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { useState } from "react";
import ContactModal from "@/components/ContactModal";

const Discovery = () => {
  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();
  const [showContactModal, setShowContactModal] = useState(false);

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
            <p className="text-sm text-slate-500 mb-6">
              Signal strength: Rising • Frequency: 432 Hz
            </p>

            <StandardButton
              onClick={() => setShowContactModal(true)}
              variant="standard"
              size="default"
              className="flex items-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </StandardButton>
          </div>

          <div className="flex flex-col space-y-8 max-w-4xl mx-auto">
            <div ref={addFeatureBlockRef} className="feature-block">
              <Link 
                to="/library" 
                className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 flex items-center space-x-6 w-full"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-200 mb-2">Transmissions</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Your saved signal archive
                  </p>
                </div>
              </Link>
            </div>

            <div ref={addFeatureBlockRef} className="feature-block">
              <Link 
                to="/book-browser" 
                className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 flex items-center space-x-6 w-full"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Search className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-200 mb-2">Book Browser</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Discover new sci-fi signals
                  </p>
                </div>
              </Link>
            </div>

            <div ref={addFeatureBlockRef} className="feature-block">
              <Link 
                to="/author-matrix" 
                className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 flex items-center space-x-6 w-full"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-200 mb-2">Author Matrix</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Explore author consciousness maps
                  </p>
                </div>
              </Link>
            </div>

            <div ref={addFeatureBlockRef} className="feature-block">
              <Link 
                to="/thread-map" 
                className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 flex items-center space-x-6 w-full"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Map className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-200 mb-2">Chrono Thread</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Timeline consciousness map
                  </p>
                </div>
              </Link>
            </div>

            <div ref={addFeatureBlockRef} className="feature-block">
              <Link 
                to="/publisher-resonance" 
                className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-purple-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-purple-500/10 flex items-center space-x-6 w-full"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <Building className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-200 mb-2">Publisher Resonance</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Explore publisher consciousness
                  </p>
                </div>
              </Link>
            </div>

            <div ref={addFeatureBlockRef} className="feature-block">
              <Link 
                to="/test-brain" 
                className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 hover:bg-slate-800/50 hover:border-cyan-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-cyan-500/10 flex items-center space-x-6 w-full"
              >
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-200 mb-2">Neural Map</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Neural consciousness visualization
                  </p>
                </div>
              </Link>
            </div>
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

        <ContactModal 
          isOpen={showContactModal} 
          onClose={() => setShowContactModal(false)} 
        />
      </div>
    </AuthWrapper>
  );
};

export default Discovery;
