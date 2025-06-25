
import React from 'react';
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { Building } from "lucide-react";

const PublisherResonance = () => {
  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Building className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-4xl font-light text-slate-200 tracking-wide">
                <span className="text-purple-400">Publisher Resonance</span>
              </h1>
            </div>
            
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Mapping the consciousness patterns of publishing houses
            </p>

            <div className="bg-slate-800/30 border border-purple-500/30 rounded-lg p-8 max-w-2xl mx-auto">
              <div className="text-purple-400 mb-4">
                <Building className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h2 className="text-xl text-slate-200 mb-4">Coming Soon</h2>
              <p className="text-slate-400 mb-6">
                The Publisher Resonance matrix is currently being calibrated to map the collective consciousness 
                of publishing houses and their thematic resonances.
              </p>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="w-2 h-2 bg-purple-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default PublisherResonance;
