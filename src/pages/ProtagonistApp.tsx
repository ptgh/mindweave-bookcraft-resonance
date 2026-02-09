import React, { useState, useEffect } from 'react';
import { MessageCircle, Download, Share2, Smartphone } from 'lucide-react';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { StandardButton } from '@/components/ui/standard-button';
import { SEOHead } from '@/components/SEOHead';

const ProtagonistApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt (Chrome/Edge/Samsung)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Speak to a Protagonist – Leafnode',
        text: 'Chat with characters from the greatest science fiction books ever written.',
        url: window.location.origin + '/protagonists',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SEOHead
        title="Install Protagonist Chat – Leafnode"
        description="Download the Protagonist Chat app to speak with characters from science fiction literature on your phone."
      />
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-lg">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-violet-400" />
          </div>
          <h1 className="text-2xl font-light text-slate-200 tracking-wide mb-2">
            Protagonist Chat
          </h1>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Speak with characters from the greatest science fiction ever written. Voice-enabled, persistent memory.
          </p>
        </div>

        {/* Install Card */}
        <Card className="bg-slate-800/50 border-slate-700/50 p-6 mb-6">
          {isInstalled ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-lg text-slate-200 font-medium mb-1">Already Installed</h2>
              <p className="text-sm text-slate-400">Open the app from your home screen to start chatting with protagonists.</p>
            </div>
          ) : isIOS ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Download className="w-6 h-6 text-violet-400" />
              </div>
              <h2 className="text-lg text-slate-200 font-medium mb-2">Install on iPhone</h2>
              <div className="text-sm text-slate-400 space-y-2">
                <p>1. Tap the <span className="text-blue-400 font-medium">Share</span> button <Share2 className="w-3.5 h-3.5 inline text-blue-400" /> in Safari</p>
                <p>2. Scroll down and tap <span className="text-slate-200 font-medium">"Add to Home Screen"</span></p>
                <p>3. Tap <span className="text-blue-400 font-medium">Add</span></p>
              </div>
            </div>
          ) : deferredPrompt ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Download className="w-6 h-6 text-violet-400" />
              </div>
              <h2 className="text-lg text-slate-200 font-medium mb-3">Install as App</h2>
              <p className="text-sm text-slate-400 mb-4">Add to your home screen for instant access — no app store needed.</p>
              <StandardButton onClick={handleInstall} className="bg-violet-500/20 border-violet-500/30 text-violet-300 hover:bg-violet-500/30">
                <Download className="w-4 h-4 mr-2" />
                Install Protagonist Chat
              </StandardButton>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Download className="w-6 h-6 text-violet-400" />
              </div>
              <h2 className="text-lg text-slate-200 font-medium mb-2">Install as App</h2>
              <p className="text-sm text-slate-400 mb-3">
                Open this page in <span className="text-slate-200">Chrome</span>, <span className="text-slate-200">Edge</span>, or <span className="text-slate-200">Safari</span> on your phone, then use the browser menu to "Add to Home Screen".
              </p>
            </div>
          )}
        </Card>

        {/* Share */}
        {typeof navigator.share === 'function' && (
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 hover:text-violet-400 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share with a friend
          </button>
        )}

        {/* Features */}
        <div className="mt-8 space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-medium px-1">Features</h3>
          {[
            { label: 'Voice conversations with ElevenLabs', icon: '🎙️' },
            { label: 'Characters remember you across sessions', icon: '🧠' },
            { label: 'Strict narrative fidelity — no breaking character', icon: '📖' },
            { label: 'Works offline once installed', icon: '📡' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <span className="text-lg">{f.icon}</span>
              <span className="text-sm text-slate-300">{f.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ProtagonistApp;
