import { BookOpen, LogOut, Instagram, Menu, Shield, ChevronDown, Database, Sparkles, User, Film, Users } from "lucide-react";
import { useCallback, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { StandardButton } from "./ui/standard-button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { ProfileEditModal } from "./ProfileEditModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { hasRole, profile } = useProfile();
  const haptic = useHapticFeedback();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const userLabel =
    profile?.display_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
    (user?.id ? `User ${user.id.slice(0, 8)}` : 'Account');

  const handleMenuItemTap = useCallback(() => {
    haptic.selection();
  }, [haptic]);

  const handleSignOut = useCallback(() => {
    haptic.impact.medium();
    signOut();
  }, [haptic, signOut]);

  const handleOpenMenu = useCallback(() => {
    haptic.impact.light();
  }, [haptic]);

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Admin single menu item (consolidated)
  const adminMenuItems = [
    { to: '/admin/enrichment', label: 'Data Enrichment', icon: Sparkles },
  ];
  
  return (
    <header className="bg-slate-900" role="banner" aria-label="Site header">
      <div className="container mx-auto px-4 py-2 md:px-6 md:py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link 
              to="/" 
              className="flex items-center space-x-2 md:space-x-3 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-lg p-1"
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
              className="lg:hidden text-slate-400 hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded p-1"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6 min-w-0">
            {/* Instagram icon on desktop - stays in header right area */}
            <a
              href="https://instagram.com/leafnode.scifi"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:block text-slate-400 hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded p-1"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            
            <nav className="hidden lg:flex flex-1 min-w-0 items-center gap-3 xl:gap-4 overflow-x-auto overscroll-x-contain scrollbar-hide smooth-scroll pr-2" role="navigation" aria-label="Main navigation">
              <Link
                to="/"
                className={`transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Home
              </Link>
              <Link
                to="/library"
                className={`transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/library' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Transmissions
              </Link>
              <Link
                to="/book-browser"
                className={`transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/book-browser' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Signal Archive
              </Link>
              <Link
                to="/author-matrix"
                className={`transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/author-matrix' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Author Matrix
              </Link>
              <Link
                to="/insights"
                className={`transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/insights' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Reading Insights
              </Link>
              <Link
                to="/publisher-resonance"
                className={`transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/publisher-resonance' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Publisher Resonance
              </Link>
              <Link
                to="/test-brain"
                className={`transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/test-brain' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                Neural Map
              </Link>
              <Link
                to="/community"
                className={`transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap ${
                  location.pathname === '/community' 
                    ? 'text-emerald-400' 
                    : 'text-slate-300 hover:text-emerald-400'
                }`}
              >
                Community
              </Link>
              <Link
                to="/book-to-screen"
                className={`transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap flex items-center gap-1 ${
                  location.pathname === '/book-to-screen' 
                    ? 'text-amber-400' 
                    : 'text-slate-300 hover:text-amber-400'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                Book to Screen
              </Link>
              
              {/* Desktop Admin Dropdown */}
              {hasRole('admin') && (
                <DropdownMenu open={adminMenuOpen} onOpenChange={setAdminMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded px-1.5 py-1 whitespace-nowrap flex items-center gap-1 ${
                        isAdminRoute 
                          ? 'text-amber-400' 
                          : 'text-amber-300/70 hover:text-amber-400'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Admin
                      <ChevronDown className={`w-3 h-3 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/20 shadow-2xl shadow-amber-500/10"
                  >
                    {adminMenuItems.map((item) => (
                      <DropdownMenuItem key={item.to} asChild>
                        <Link
                          to={item.to}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
                            location.pathname === item.to
                              ? 'text-amber-400'
                              : 'text-slate-200 hover:text-amber-400'
                          }`}
                        >
                          <item.icon className="w-4 h-4 text-amber-400/70" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>

            {user && (
              <div className="flex items-center space-x-1 md:space-x-3">
                <NotificationsDropdown />
                <button
                  onClick={() => setShowProfileEdit(true)}
                  className="hidden md:flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 bg-transparent border border-slate-600 text-slate-300 hover:border-blue-400 hover:text-blue-400"
                >
                  <User className="w-3 h-3" />
                  <span className="max-w-[140px] truncate">{userLabel}</span>
                </button>
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

            {/* Profile Edit Modal */}
            <ProfileEditModal 
              isOpen={showProfileEdit} 
              onClose={() => setShowProfileEdit(false)} 
            />

            {/* Mobile Menu - Dropdown with scroll support */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  onClick={handleOpenMenu}
                  className="lg:hidden inline-flex items-center justify-center rounded p-2 text-slate-300 hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                sideOffset={8} 
                className="z-[9999] min-w-56 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain bg-slate-900/95 backdrop-blur-xl border border-blue-500/20 shadow-2xl shadow-blue-500/10 [webkit-overflow-scrolling:touch]"
              >
                <DropdownMenuItem asChild>
                  <Link
                    to="/"
                    onClick={handleMenuItemTap}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-[0.98] ${
                      location.pathname === '/'
                        ? 'text-blue-400'
                        : 'text-slate-200'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400/50" />
                    Home
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    to="/library"
                    onClick={handleMenuItemTap}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-[0.98] ${
                      location.pathname === '/library'
                        ? 'text-blue-400'
                        : 'text-slate-200'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-400/70" />
                    Transmissions
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    to="/book-browser"
                    onClick={handleMenuItemTap}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-[0.98] ${
                      location.pathname === '/book-browser'
                        ? 'text-blue-400'
                        : 'text-slate-200'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-dashed border-blue-400/50 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    </div>
                    Signal Archive
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    to="/author-matrix"
                    onClick={handleMenuItemTap}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-[0.98] ${
                      location.pathname === '/author-matrix'
                        ? 'text-blue-400'
                        : 'text-slate-200'
                    }`}
                  >
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
                  <Link
                    to="/insights"
                    onClick={handleMenuItemTap}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-[0.98] ${
                      location.pathname === '/insights'
                        ? 'text-blue-400'
                        : 'text-slate-200'
                    }`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
                    </div>
                    Reading Insights
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    to="/publisher-resonance"
                    onClick={handleMenuItemTap}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-[0.98] ${
                      location.pathname === '/publisher-resonance'
                        ? 'text-blue-400'
                        : 'text-slate-200'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 border border-blue-400/50" />
                    Publisher Resonance
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-blue-500/20" />

                <DropdownMenuItem asChild>
                  <Link
                    to="/test-brain"
                    onClick={handleMenuItemTap}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-[0.98] ${
                      location.pathname === '/test-brain'
                        ? 'text-blue-400'
                        : 'text-slate-200'
                    }`}
                  >
                    <div className="w-4 h-4 relative">
                      <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-pulse" />
                      <div className="absolute inset-0.5 rounded-full bg-blue-400/40" />
                    </div>
                    Neural Map
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    to="/book-to-screen"
                    onClick={handleMenuItemTap}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-[0.98] ${
                      location.pathname === '/book-to-screen'
                        ? 'text-amber-400'
                        : 'text-slate-200'
                    }`}
                  >
                    <Film className="w-4 h-4 text-amber-400/70" />
                    Book to Screen
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    to="/community"
                    onClick={handleMenuItemTap}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer active:scale-[0.98] ${
                      location.pathname === '/community'
                        ? 'text-emerald-400'
                        : 'text-slate-200'
                    }`}
                  >
                    <Users className="w-4 h-4 text-emerald-400/70" />
                    Community
                  </Link>
                </DropdownMenuItem>

                {/* Mobile Admin Submenu */}
                {hasRole('admin') && (
                  <>
                    <DropdownMenuSeparator className="bg-amber-500/20" />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-amber-300/70 hover:text-amber-400 data-[state=open]:text-amber-400">
                        <Shield className="w-4 h-4 text-amber-400/70" />
                        Admin
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/20 shadow-2xl">
                          {adminMenuItems.map((item) => (
                            <DropdownMenuItem key={item.to} asChild>
                              <Link
                                to={item.to}
                                onClick={handleMenuItemTap}
                                className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer ${
                                  location.pathname === item.to
                                    ? 'text-amber-400'
                                    : 'text-slate-200 hover:text-amber-400'
                                }`}
                              >
                                <item.icon className="w-4 h-4 text-amber-400/70" />
                                {item.label}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </>
                )}

                {user && (
                  <>
                    <DropdownMenuSeparator className="bg-slate-700/50" />
                    <div className="px-3 py-2 text-xs text-slate-400 truncate">
                      {user.email}
                    </div>
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-slate-200 hover:text-red-400 active:scale-[0.98]"
                    >
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
