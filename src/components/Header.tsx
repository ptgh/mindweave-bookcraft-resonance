import { BookOpen, LogOut, Instagram, Menu } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { StandardButton } from "./ui/standard-button";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

const Header = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  return (
    <header className="bg-slate-900">
      <div className="container mx-auto px-4 py-2 md:px-6 md:py-2">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-2 md:space-x-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg p-1"
            aria-label="Leafnode - Home"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
              <div className="w-4 h-4 md:w-6 md:h-6 bg-blue-400 rounded-full animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-light text-slate-200 tracking-wider">
                LEAFNODE
              </h1>
              <p className="text-xs text-slate-400 -mt-1">for the future-literate</p>
            </div>
          </Link>
          
          <div className="flex items-center space-x-2 md:space-x-6">
            <a
              href="https://instagram.com/leafnode.scifi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded p-1"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            
            <nav className="hidden lg:flex items-center space-x-3 xl:space-x-4" role="navigation" aria-label="Main navigation">
              <Link
                to="/"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Home
              </Link>
              <Link
                to="/library"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/library' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Transmissions
              </Link>
              <Link
                to="/book-browser"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/book-browser' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Signal Archive
              </Link>
              <Link
                to="/author-matrix"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/author-matrix' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Author Matrix
              </Link>
              <Link
                to="/thread-map"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/thread-map' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Chrono Thread
              </Link>
              <Link
                to="/publisher-resonance"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/publisher-resonance' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Publisher Resonance
              </Link>
              <Link
                to="/test-brain"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/test-brain' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Neural Map
              </Link>
            </nav>

            {user && (
              <div className="flex items-center space-x-1 md:space-x-4">
                <span className="hidden md:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 py-1 px-2 bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] hover:border-[#89b4fa] hover:text-[#89b4fa] hover:shadow-[0_0_10px_rgba(137,180,250,0.3)]">
                  {user.email}
                </span>
                <StandardButton
                  onClick={signOut}
                  variant="standard"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Sign Out</span>
                </StandardButton>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="lg:hidden inline-flex items-center justify-center rounded p-2 text-slate-300 hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                sideOffset={8} 
                className="z-[9999] min-w-56 bg-slate-900/95 backdrop-blur-xl border border-blue-500/20 shadow-2xl shadow-blue-500/10"
              >
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center gap-3 py-3 px-4 text-slate-200 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 rounded-md">
                    <div className="w-2 h-2 rounded-full bg-blue-400/50" />
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/library" className="flex items-center gap-3 py-3 px-4 text-slate-200 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 rounded-md">
                    <BookOpen className="w-4 h-4 text-blue-400/70" />
                    Transmissions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/book-browser" className="flex items-center gap-3 py-3 px-4 text-slate-200 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 rounded-md">
                    <div className="w-4 h-4 rounded-full border-2 border-dashed border-blue-400/50 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    </div>
                    Signal Archive
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/author-matrix" className="flex items-center gap-3 py-3 px-4 text-slate-200 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 rounded-md">
                    <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                      <div className="w-1.5 h-1.5 rounded-sm bg-blue-400/50" />
                      <div className="w-1.5 h-1.5 rounded-sm bg-blue-400/70" />
                      <div className="w-1.5 h-1.5 rounded-sm bg-blue-400/70" />
                      <div className="w-1.5 h-1.5 rounded-sm bg-blue-400/50" />
                    </div>
                    Author Matrix
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/thread-map" className="flex items-center gap-3 py-3 px-4 text-slate-200 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 rounded-md">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
                    </div>
                    Chrono Thread
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/publisher-resonance" className="flex items-center gap-3 py-3 px-4 text-slate-200 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 rounded-md">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 border border-blue-400/50" />
                    Publisher Resonance
                  </Link>
                </DropdownMenuItem>
                <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent my-2" />
                <DropdownMenuItem asChild>
                  <Link to="/test-brain" className="flex items-center gap-3 py-3 px-4 text-slate-200 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 rounded-md">
                    <div className="w-4 h-4 relative">
                      <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-pulse" />
                      <div className="absolute inset-1 rounded-full bg-blue-400/40" />
                    </div>
                    Neural Map
                  </Link>
                </DropdownMenuItem>
                {user && (
                  <>
                    <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent my-2" />
                    <DropdownMenuItem onSelect={signOut} className="flex items-center gap-3 py-3 px-4 text-slate-200 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 rounded-md">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
