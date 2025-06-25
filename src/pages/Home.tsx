
import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import Auth from "./Auth";
import { StandardButton } from "@/components/ui/standard-button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Home = () => {
  const { user } = useAuth();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Transmissions", href: "/transmissions" },
    { name: "Signal Archive", href: "/book-browser" },
    { name: "Author Matrix", href: "/author-matrix" },
    { name: "Chrono Thread", href: "/thread-map" },
    { name: "Publisher Resonance", href: "/publisher-resonance" },
    { name: "Neural Map", href: "/test-brain" },
  ];

  return (
    <AuthWrapper fallback={<Auth />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-light text-slate-200 mb-4 tracking-wide">
              LEAFNODE
            </h1>
            <p className="text-slate-400 text-lg mb-2">
              Mindweave Bookcraft Resonance
            </p>
            <p className="text-slate-500 text-sm">
              For the future-literate
            </p>
          </div>

          {/* Navigation Section */}
          <div className="text-center mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 max-w-6xl mx-auto">
              {navigation.map((item) => (
                <Link key={item.name} to={item.href}>
                  <StandardButton
                    variant="standard"
                    size="sm"
                    className="w-full"
                  >
                    {item.name}
                  </StandardButton>
                </Link>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
                <div className="text-2xl mb-3">📚</div>
                <h3 className="text-slate-200 font-medium mb-2">Track Transmissions</h3>
                <p className="text-slate-400 text-sm">
                  Log your literary journey through consciousness-expanding texts
                </p>
              </div>
              
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
                <div className="text-2xl mb-3">🧠</div>
                <h3 className="text-slate-200 font-medium mb-2">Map Connections</h3>
                <p className="text-slate-400 text-sm">
                  Discover the neural pathways between authors and ideas
                </p>
              </div>
              
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
                <div className="text-2xl mb-3">📡</div>
                <h3 className="text-slate-200 font-medium mb-2">Archive Signals</h3>
                <p className="text-slate-400 text-sm">
                  Build your personal library of transformative knowledge
                </p>
              </div>
            </div>
            
            <Link to="/transmissions">
              <StandardButton
                variant="primary"
                className="touch-manipulation active:scale-95"
              >
                Begin Transmission Mapping
              </StandardButton>
            </Link>
          </div>
          
          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Tuning frequency: 432 Hz</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Signal strength: Rising</span>
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
};

export default Home;
