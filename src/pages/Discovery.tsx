
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Discovery = () => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-light tracking-wider text-slate-200 mb-2">
            LEAFNODE
          </h1>
          <p className="text-sm text-slate-400 mb-8">
            for the future-literate
          </p>
          
          {/* Literary Pulse Animation */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex space-x-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-slate-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <div className="w-1 h-1 bg-slate-600 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }}></div>
            </div>
          </div>
          
          <div className="text-slate-300 text-sm mb-4">
            Mapping the narrative threads of consciousness
          </div>
          <div className="text-slate-500 text-xs">
            Signal strength: Rising • Frequency: 432 Hz
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="max-w-2xl mx-auto grid gap-6 md:grid-cols-2">
          <Link to="/library" className="group">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500/20">
                  <div className="w-4 h-4 bg-blue-400 rounded-sm"></div>
                </div>
                <h3 className="text-lg font-medium text-slate-200 group-hover:text-blue-300 transition-colors">
                  Transmissions
                </h3>
              </div>
              <p className="text-sm text-slate-400">
                Your saved signal archive
              </p>
            </div>
          </Link>

          <div className="group cursor-not-allowed">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 opacity-60">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-600/20">
                  <div className="w-4 h-4 bg-slate-500 rounded-full"></div>
                </div>
                <h3 className="text-lg font-medium text-slate-400">
                  Search
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                Discover new signals • Coming Soon
              </p>
            </div>
          </div>

          <div className="group cursor-not-allowed">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 opacity-60">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-600/20">
                  <div className="w-4 h-4 bg-slate-500 rounded-sm border border-slate-400"></div>
                </div>
                <h3 className="text-lg font-medium text-slate-400">
                  Classification
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                Tag and categorize • Coming Soon
              </p>
            </div>
          </div>

          <div className="group cursor-not-allowed">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 opacity-60">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-600/20">
                  <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-400">
                  Chrono Thread
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                Timeline consciousness map • Coming Soon
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
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
