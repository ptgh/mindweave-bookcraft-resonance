import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { Link } from "react-router-dom";
import { Brain, BookOpen, Users, Search, Map, Calendar, Network, Sparkles, Mail } from "lucide-react";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";
import { StandardButton } from "@/components/ui/standard-button";
import ContactModal from "@/components/ContactModal";
import ContributionButton from "@/components/ContributionButton";
import { getTransmissions } from "@/services/transmissionsService";
import { usePatternRecognition } from "@/hooks/usePatternRecognition";
import { useHistoricalContext } from "@/hooks/useHistoricalContext";
import ConceptualBridges from "@/components/ConceptualBridges";

const Discovery = () => {
  const { mainContainerRef, heroTitleRef, addFeatureBlockRef } = useGSAPAnimations();
  const [showContactModal, setShowContactModal] = useState(false);

  const { data: transmissions = [], isLoading } = useQuery({
    queryKey: ['transmissions'],
    queryFn: getTransmissions,
  });

  const patterns = usePatternRecognition(transmissions);
  const historical = useHistoricalContext(transmissions);

  const features = [
    {
      icon: BookOpen,
      title: "Transmissions",
      description: "Your personal sci-fi library mapped across consciousness",
      link: "/library",
      color: "blue"
    },
    {
      icon: Search,
      title: "Book Browser",
      description: "Explore curated sci-fi collections and free ebooks",
      link: "/book-browser",
      color: "purple"
    },
    {
      icon: Users,
      title: "Author Matrix",
      description: "Navigate the interconnected web of sci-fi authors",
      link: "/author-matrix",
      color: "green"
    },
    {
      icon: Calendar,
      title: "Chrono Thread",
      description: "Temporal navigation through literary history",
      link: "/thread-map",
      color: "amber"
    },
    {
      icon: Map,
      title: "Publisher Resonance",
      description: "Discover patterns in publisher catalogs",
      link: "/publisher-resonance",
      color: "pink"
    },
    {
      icon: Network,
      title: "Neural Map",
      description: "Visualize conceptual connections in your library",
      link: "/test-brain",
      color: "cyan"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50",
      purple: "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50",
      green: "bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50",
      amber: "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50",
      pink: "bg-pink-500/10 border-pink-500/30 hover:bg-pink-500/20 hover:border-pink-500/50",
      cyan: "bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main ref={mainContainerRef} className="container mx-auto px-4 sm:px-6 py-8">
          {/* Hero Section */}
          <div ref={addFeatureBlockRef} className="feature-block text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Brain className="w-12 h-12 text-blue-400 animate-pulse" />
            </div>
            <h1 ref={heroTitleRef} className="text-3xl sm:text-4xl font-light text-slate-200 mb-3">
              Discovery Hub
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Explore consciousness mapping, pattern recognition, and the interconnected web of sci-fi signals
            </p>
          </div>

          {/* Pattern Insights Section */}
          {!isLoading && patterns.hasData && (
            <div ref={addFeatureBlockRef} className="feature-block mb-12">
              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-medium text-slate-200">Pattern Insights</h2>
                </div>
                <div className="space-y-2">
                  {patterns.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm text-slate-300">
                      <span className="text-purple-400 mt-0.5">•</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conceptual Bridges Section */}
          {!isLoading && patterns.bridges.length > 0 && (
            <div ref={addFeatureBlockRef} className="feature-block mb-12">
              <ConceptualBridges bridges={patterns.bridges} />
            </div>
          )}

          {/* Historical Context Insights */}
          {!isLoading && historical.hasData && (
            <div ref={addFeatureBlockRef} className="feature-block mb-12">
              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-medium text-slate-200">Historical Context</h2>
                </div>
                <div className="space-y-2">
                  {historical.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm text-slate-300">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Features Grid */}
          <div ref={addFeatureBlockRef} className="feature-block">
            <h2 className="text-xl font-medium text-slate-200 mb-6 text-center">Explore Features</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Link
                  key={feature.title}
                  to={feature.link}
                  className={`p-6 rounded-lg border transition-all hover:scale-[1.02] ${getColorClasses(feature.color)}`}
                >
                  <feature.icon className="w-8 h-8 mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-200 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pb-8">
            <footer className="text-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Quantum resonance stabilized</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <StandardButton
                    onClick={() => setShowContactModal(true)}
                    variant="standard"
                    size="xs"
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Make Contact
                  </StandardButton>
                  <ContributionButton walletAddress="0xDd966928cC8EA2e61221170490D696BD224866bf" />
                </div>
              </div>
            </footer>
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
