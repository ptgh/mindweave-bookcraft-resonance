
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, BookOpen, Users, Search, Map, Eye } from "lucide-react";

const Discovery = () => {
  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-12">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-light text-slate-200 mb-4 tracking-wide">
              Welcome to <span className="text-blue-400">LEAFNODE</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Map your intellectual journey through the books that shape you. 
              Discover patterns, connections, and insights in your reading consciousness.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link 
              to="/library" 
              className="group bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-medium text-slate-200">Transmissions</h2>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Your personal library of transformative books. Track what you're reading, 
                what resonated with you, and the insights you've gathered.
              </p>
            </Link>

            <Link 
              to="/book-browser" 
              className="group bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <Search className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-xl font-medium text-slate-200">Book Browser</h2>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Discover new books that align with your interests. Browse curated collections 
                and find your next transformative read.
              </p>
            </Link>

            <Link 
              to="/author-matrix" 
              className="group bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-xl font-medium text-slate-200">Author Matrix</h2>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Explore the network of authors who shape future consciousness. 
                Discover connections and patterns across thought leaders.
              </p>
            </Link>

            <Link 
              to="/thread-map" 
              className="group bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <Map className="w-6 h-6 text-orange-400" />
                </div>
                <h2 className="text-xl font-medium text-slate-200">Chrono Thread</h2>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Visualize the temporal flow of your reading journey. 
                See how your literary consciousness has evolved over time.
              </p>
            </Link>

            <Link 
              to="/test-brain" 
              className="group bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-xl font-medium text-slate-200">Neural Map</h2>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Experience your library as a living neural network. 
                Watch connections form and evolve between the books that shape your mind.
              </p>
            </Link>

            <div className="group bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-slate-500/20 rounded-lg flex items-center justify-center group-hover:bg-slate-500/30 transition-colors">
                  <Eye className="w-6 h-6 text-slate-400" />
                </div>
                <h2 className="text-xl font-medium text-slate-200">Insights</h2>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Coming soon: AI-powered insights into your reading patterns, 
                recommendations, and consciousness evolution analytics.
              </p>
            </div>
          </div>

          <div className="text-center mt-16">
            <p className="text-slate-500 text-sm">
              Begin your journey of conscious reading and intellectual mapping
            </p>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default Discovery;
