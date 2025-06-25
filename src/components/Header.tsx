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
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-400" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2C10.5 2 9.2 2.8 8.5 4C7.8 2.8 6.5 2 5 2C2.8 2 1 3.8 1 6C1 8.2 2.8 10 5 10C6.5 10 7.8 9.2 8.5 8C9.2 9.2 10.5 10 12 10C14.2 10 16 8.2 16 6C16 3.8 14.2 2 12 2M12 22C17.5 22 22 17.5 22 12C22 11.3 21.9 10.7 21.8 10.1C21.2 10.7 20.4 11 19.5 11C17.6 11 16 9.4 16 7.5C16 6.6 16.3 5.8 16.9 5.2C16.3 5.1 15.7 5 15 5C9.5 5 5 9.5 5 15C5 20.5 9.5 25 15 25C20.5 25 25 20.5 25 15C25 10.8 22.4 7.2 18.7 5.8C18.9 6.5 19 7.2 19 8C19 13.5 14.5 18 9 18C8.3 18 7.7 17.9 7.1 17.8C7.7 18.4 8.5 18.7 9.4 18.7C11.3 18.7 12.9 17.1 12.9 15.2C12.9 14.3 12.6 13.5 12 12.9C12.6 12.3 13 11.5 13 10.6C13 8.7 11.4 7.1 9.5 7.1C8.6 7.1 7.8 7.4 7.2 8C7.1 7.4 7 6.8 7 6.2C7 0.7 11.5 -3.8 17 -3.8"
                />
              </svg>
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
