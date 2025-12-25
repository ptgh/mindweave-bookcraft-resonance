import { BookOpen, LogOut, Instagram, Menu, Shield, X } from "lucide-react";
import { useState, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { StandardButton } from "./ui/standard-button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { hasRole } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const haptic = useHapticFeedback();

  const closeMobileMenu = useCallback(() => {
    haptic.impact.light();
    setMobileMenuOpen(false);
  }, [haptic]);

  const handleMenuItemTap = useCallback(() => {
    haptic.selection();
    closeMobileMenu();
  }, [haptic, closeMobileMenu]);

  const handleSignOut = useCallback(() => {
    haptic.impact.medium();
    closeMobileMenu();
    signOut();
  }, [haptic, closeMobileMenu, signOut]);

  const handleOpenMenu = useCallback(() => {
    haptic.impact.light();
    setMobileMenuOpen(true);
  }, [haptic]);

  // Swipe right to close the menu (since it slides in from right)
  const { handlers: swipeHandlers } = useSwipeGesture(
    {
      onSwipeRight: closeMobileMenu,
    },
    {
      threshold: 50,
      velocityThreshold: 0.3,
      direction: 'right',
    }
  );
  
  return (
    <header className="bg-slate-900">
      <div className="container mx-auto px-4 py-2 md:px-6 md:py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
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
            
            {/* Instagram icon on mobile - next to dot */}
            <a
              href="https://instagram.com/leafnode.scifi"
              target="_blank"
              rel="noopener noreferrer"
              className="lg:hidden text-slate-400 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded p-1"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-6">
            {/* Instagram icon on desktop - stays in header right area */}
            <a
              href="https://instagram.com/leafnode.scifi"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:block text-slate-400 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded p-1"
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
                to="/insights"
                className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/insights' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Reading Insights
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
              {hasRole('admin') && (
                <Link
                  to="/admin/enrichment"
                  className={`transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap flex items-center gap-1 ${
                    location.pathname.startsWith('/admin') 
                      ? 'text-amber-400' 
                      : 'text-amber-300/70 hover:text-amber-400'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
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

            {/* Mobile Menu - Full-height Sheet with swipe support */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button 
                  onClick={handleOpenMenu}
                  className="lg:hidden inline-flex items-center justify-center rounded p-2 text-slate-300 hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-full sm:w-80 bg-slate-900/98 backdrop-blur-xl border-l border-blue-500/20 p-0 overflow-hidden"
              >
                <div 
                  className="flex flex-col h-full touch-pan-y"
                  {...swipeHandlers}
                >
                  {/* Sheet Header */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-400 rounded-full animate-pulse" />
                      <span className="text-lg font-light text-slate-200 tracking-wider">LEAFNODE</span>
                    </div>
                    <button
                      onClick={closeMobileMenu}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors active:scale-95"
                      aria-label="Close menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Swipe indicator */}
                  <div className="flex justify-center py-2">
                    <div className="w-10 h-1 rounded-full bg-slate-700" />
                  </div>

                  {/* Scrollable Nav Items */}
                  <nav className="flex-1 overflow-y-auto overscroll-contain py-2 px-2" role="navigation" aria-label="Mobile navigation">
                    <div className="space-y-1">
                      <Link
                        to="/"
                        onClick={handleMenuItemTap}
                        className={`flex items-center gap-4 min-h-[56px] px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200 active:scale-[0.98] ${
                          location.pathname === '/'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-blue-400 active:bg-slate-700'
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full bg-blue-400/50" />
                        Home
                      </Link>

                      <Link
                        to="/library"
                        onClick={handleMenuItemTap}
                        className={`flex items-center gap-4 min-h-[56px] px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200 active:scale-[0.98] ${
                          location.pathname === '/library'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-blue-400 active:bg-slate-700'
                        }`}
                      >
                        <BookOpen className="w-5 h-5 text-blue-400/70" />
                        Transmissions
                      </Link>

                      <Link
                        to="/book-browser"
                        onClick={handleMenuItemTap}
                        className={`flex items-center gap-4 min-h-[56px] px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200 active:scale-[0.98] ${
                          location.pathname === '/book-browser'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-blue-400 active:bg-slate-700'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full border-2 border-dashed border-blue-400/50 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                        </div>
                        Signal Archive
                      </Link>

                      <Link
                        to="/author-matrix"
                        onClick={handleMenuItemTap}
                        className={`flex items-center gap-4 min-h-[56px] px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200 active:scale-[0.98] ${
                          location.pathname === '/author-matrix'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-blue-400 active:bg-slate-700'
                        }`}
                      >
                        <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                          <div className="w-2 h-2 rounded-sm bg-blue-400/50" />
                          <div className="w-2 h-2 rounded-sm bg-blue-400/70" />
                          <div className="w-2 h-2 rounded-sm bg-blue-400/70" />
                          <div className="w-2 h-2 rounded-sm bg-blue-400/50" />
                        </div>
                        Author Matrix
                      </Link>

                      <Link
                        to="/insights"
                        onClick={handleMenuItemTap}
                        className={`flex items-center gap-4 min-h-[56px] px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200 active:scale-[0.98] ${
                          location.pathname === '/insights'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-blue-400 active:bg-slate-700'
                        }`}
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
                        </div>
                        Reading Insights
                      </Link>

                      <Link
                        to="/publisher-resonance"
                        onClick={handleMenuItemTap}
                        className={`flex items-center gap-4 min-h-[56px] px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200 active:scale-[0.98] ${
                          location.pathname === '/publisher-resonance'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-blue-400 active:bg-slate-700'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 border border-blue-400/50" />
                        Publisher Resonance
                      </Link>

                      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent my-3" />

                      <Link
                        to="/test-brain"
                        onClick={handleMenuItemTap}
                        className={`flex items-center gap-4 min-h-[56px] px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200 active:scale-[0.98] ${
                          location.pathname === '/test-brain'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-blue-400 active:bg-slate-700'
                        }`}
                      >
                        <div className="w-5 h-5 relative">
                          <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-pulse" />
                          <div className="absolute inset-1 rounded-full bg-blue-400/40" />
                        </div>
                        Neural Map
                      </Link>

                      {hasRole('admin') && (
                        <>
                          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent my-3" />
                          <Link
                            to="/admin/enrichment"
                            onClick={handleMenuItemTap}
                            className={`flex items-center gap-4 min-h-[56px] px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200 active:scale-[0.98] ${
                              location.pathname.startsWith('/admin')
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'text-amber-300 hover:bg-amber-500/10 hover:text-amber-400 active:bg-amber-500/20'
                            }`}
                          >
                            <Shield className="w-5 h-5 text-amber-400/70" />
                            Admin Panel
                          </Link>
                        </>
                      )}
                    </div>
                  </nav>

                  {/* Footer with User Info & Sign Out */}
                  {user && (
                    <div className="border-t border-slate-700/50 p-4 space-y-3">
                      <div className="text-sm text-slate-400 truncate px-2">
                        {user.email}
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center justify-center gap-2 w-full min-h-[52px] px-4 py-3 rounded-xl text-base font-medium text-slate-200 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 active:scale-[0.98] active:bg-red-500/30 transition-all duration-200"
                      >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
