
import React from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { Building } from "lucide-react";

const PublisherResonance = () => {
  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Header />
        
        <main className="container mx-auto px-6 py-12 flex-1">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-lg flex items-center justify-center border border-primary/30">
                <Building className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-light text-slate-200 tracking-wide">
                <span className="text-primary">Publisher Resonance</span>
              </h1>
            </div>
            
            <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
              Under construction - ready for rebuild
            </p>

            <div className="bg-slate-800/30 border border-primary/30 rounded-lg p-8 max-w-2xl mx-auto">
              <div className="text-primary mb-4">
                <Building className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h2 className="text-xl text-slate-200 mb-4">Clean Slate</h2>
              <p className="text-slate-300 leading-relaxed">
                This page has been cleared and is ready for you to rebuild from scratch.
              </p>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </AuthWrapper>
  );
};

export default PublisherResonance;
