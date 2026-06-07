import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import Lenis from "lenis";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useStore, type User } from "@/lib/store";
import NavbarConditional from "@/components/NavbarConditional";
import InstallPwaButton from "@/components/InstallPwaButton";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import CreatePost from "@/pages/CreatePost";
import PostDetail from "@/pages/PostDetail";
import FollowList from "@/pages/FollowList";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/NotFound";
import DesktopSidebar from "@/components/DesktopSidebar";
import RightSidebar from "@/components/RightSidebar";
import GlobalStoryViewer from "@/components/GlobalStoryViewer";
import { ThemeProvider } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isBootstrapping } = useStore();
  if (isBootstrapping) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => {
  const { isAuthenticated, isBootstrapping, initializeAuth, searchUsers } = useStore();
  const [scrollY, setScrollY] = useState(0);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [dSearch, setDSearch] = useState('');
  const [dResults, setDResults] = useState<User[]>([]);
  const dSearchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Parallax Scroll Offset Tracker
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  const handleDSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDSearch(val);
    if (dSearchTimeout.current) clearTimeout(dSearchTimeout.current);
    if (!val.trim()) {
      setDResults([]);
      return;
    }
    dSearchTimeout.current = setTimeout(async () => {
      const users = await searchUsers(val);
      setDResults(users);
    }, 300);
  };

  if (isBootstrapping) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground bg-background">
              Loading ChatGram...
            </div>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="relative min-h-screen w-full bg-background/40 transition-colors duration-500">
              {/* Drifting Aesthetic Parallax Background Blobs */}
              <div 
                className="fixed top-12 left-[5%] w-72 h-72 rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-[90px] pointer-events-none animate-blob-float -z-10" 
                style={{ transform: `translate3d(0, ${scrollY * 0.15}px, 0)` }}
              />
              <div 
                className="fixed bottom-20 right-[5%] w-96 h-96 rounded-full bg-purple-500/10 dark:bg-indigo-500/5 blur-[100px] pointer-events-none animate-blob-float-delayed -z-10" 
                style={{ transform: `translate3d(0, ${scrollY * -0.08}px, 0)` }}
              />
              <div 
                className="fixed top-1/2 left-[35%] w-80 h-80 rounded-full bg-blue-500/8 dark:bg-blue-500/4 blur-[110px] pointer-events-none -z-10 animate-blob-float" 
                style={{ animationDelay: '6s', transform: `translate3d(0, ${scrollY * 0.05}px, 0)` }}
              />

              {/* Layout Container */}
              <div className="mx-auto w-full min-h-screen lg:flex lg:max-w-6xl xl:max-w-7xl justify-center items-start relative z-10">
                {/* Left Sidebar (Desktop Only) */}
                {isAuthenticated && (
                  <DesktopSidebar 
                    onSearchToggle={() => setIsDesktopSearchOpen(!isDesktopSearchOpen)} 
                    isSearchOpen={isDesktopSearchOpen} 
                  />
                )}

                {/* Main Content Area */}
                <div className="flex-1 w-full max-w-2xl lg:max-w-3xl lg:px-6">
                  {/* Top Mobile/Tablet Nav conditionally shown */}
                  <NavbarConditional />
                  <InstallPwaButton />
                  
                  <main className="relative z-10 px-3 sm:px-0 pb-28 sm:pb-24 lg:py-6">
                    {/* Desktop Search Drawer Overlay */}
                    {isAuthenticated && isDesktopSearchOpen && (
                      <div className="hidden lg:block border border-black/5 dark:border-white/5 bg-card/65 backdrop-blur-xl p-4 mb-5 rounded-2xl shadow-md space-y-2">
                        <div className="relative">
                          <Input
                            value={dSearch}
                            onChange={handleDSearchChange}
                            placeholder="Search users on ChatGram..."
                            className="bg-background/50 border-white/10 dark:border-white/5 backdrop-blur-md rounded-xl"
                            autoFocus
                          />
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        {dResults.length > 0 && (
                          <div className="rounded-xl border border-black/5 dark:border-white/5 bg-card/90 backdrop-blur-xl p-1 max-h-40 overflow-y-auto shadow-inner">
                            {dResults.map(user => (
                              <button
                                key={user.id}
                                onClick={() => {
                                  setDSearch('');
                                  setDResults([]);
                                  setIsDesktopSearchOpen(false);
                                  window.location.href = `/profile/${user.username}`;
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left rounded-lg hover:bg-primary/10 transition-colors"
                              >
                                <img src={user.avatarUrl} className="h-6 w-6 rounded-full object-cover" />
                                <div className="flex flex-col">
                                  <span className="font-semibold text-xs">{user.displayName}</span>
                                  <span className="text-[10px] text-muted-foreground">@{user.username}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <Routes>
                      <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                      <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="/profile/:username/:type" element={<ProtectedRoute><FollowList /></ProtectedRoute>} />
                      <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                      <Route path="/post/:postId" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>

                {/* Right Suggestions Sidebar (Desktop Only) */}
                {isAuthenticated && <RightSidebar />}
              </div>
              {/* Global Story Viewer Overlay */}
              <GlobalStoryViewer />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
