
import { BookOpen, LogOut } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { StandardButton } from "./ui/standard-button";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  return (
    <header className="bg-slate-900 border-b border-slate-700">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg p-1"
            aria-label="Leafnode - Home"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="w-6 h-6 bg-blue-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-light text-slate-200 tracking-wider">
                LEAFNODE
              </h1>
              <p className="text-xs text-slate-400 -mt-1">for the future-literate</p>
            </div>
          </Link>
          
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex items-center space-x-6" role="navigation" aria-label="Main navigation">
              <Link
                to="/"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1 ${
                  location.pathname === '/' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Home
              </Link>
              <Link
                to="/library"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1 ${
                  location.pathname === '/library' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Transmissions
              </Link>
              <Link
                to="/book-browser"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1 ${
                  location.pathname === '/book-browser' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Signal Archive
              </Link>
              <Link
                to="/author-matrix"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1 ${
                  location.pathname === '/author-matrix' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Author Matrix
              </Link>
              <Link
                to="/thread-map"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1 ${
                  location.pathname === '/thread-map' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Chrono Thread
              </Link>
              <Link
                to="/publisher-resonance"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1 ${
                  location.pathname === '/publisher-resonance' 
                    ? 'text-purple-400' 
                    : 'text-slate-300 hover:text-purple-400'
                }`}
              >
                Publisher Resonance
              </Link>
              <Link
                to="/test-brain"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1 ${
                  location.pathname === '/test-brain' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Neural Map
              </Link>
            </nav>

            {user && (
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 py-1 px-2 bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] hover:border-[#89b4fa] hover:text-[#89b4fa] hover:shadow-[0_0_10px_rgba(137,180,250,0.3)]">
                  {user.email}
                </span>
                <StandardButton
                  onClick={signOut}
                  variant="standard"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </StandardButton>
              </div>
            )}

            {/* Mobile Navigation Toggle - for future mobile menu implementation */}
            <button 
              className="md:hidden text-slate-300 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded p-1"
              aria-label="Open navigation menu"
              aria-expanded="false"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
