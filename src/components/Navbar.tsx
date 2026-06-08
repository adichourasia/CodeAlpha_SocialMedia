
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Home as HomeIcon, Search, Clapperboard, MessageSquare, User, Heart, Plus, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

const Navbar = () => {
  const { currentUser, logout, searchUsers } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  // Search state
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Array<{ id: number; username: string; displayName: string; avatarUrl: string }>>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'request', username: 'johndoe', name: 'John Doe', avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=8b5cf6&color=fff', time: '1h ago', status: 'pending' },
    { id: 2, type: 'like', username: 'sarah_k', name: 'Sarah King', avatar: 'https://ui-avatars.com/api/?name=Sarah+King&background=3b82f6&color=fff', time: '2h ago', detail: 'liked your post' },
    { id: 3, type: 'comment', username: 'emma_b', name: 'Emma Brown', avatar: 'https://ui-avatars.com/api/?name=Emma+Brown&background=f97316&color=fff', time: '5h ago', detail: "commented: 'Love this layout!'" }
  ]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      const users = await searchUsers(value);
      setResults(users);
    }, 300);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleResultClick = (username: string) => {
    setSearch('');
    setResults([]);
    setIsSearchOpen(false);
    navigate(`/profile/${username}`);
  };

  const handleAcceptRequest = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, status: 'accepted', detail: 'Accepted friend request.' } : n)
    );
    toast.success("Friend request accepted!");
  };

  const handleDeclineRequest = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, status: 'declined', detail: 'Declined friend request.' } : n)
    );
    toast.info("Friend request declined.");
  };

  const toggleSearch = () => {
    setIsSearchOpen(prev => !prev);
    setShowNotifications(false);
  };

  const showLoopsToast = () => {
    toast.info("Loops feature is currently in design! Stay tuned.");
  };

  const isHomeActive = location.pathname === '/';
  const isProfileActive = location.pathname === `/profile/${currentUser?.username}`;
  const isMessagesActive = location.pathname === '/messages';

  return (
    <>
      {/* Top Header Bar - Mobile/Tablet Only */}
      <header className="relative z-50 border-b border-black/10 dark:border-white/5 bg-card/70 backdrop-blur-xl h-14 sm:h-16 flex items-center justify-between px-4 lg:hidden">
        {/* Left: Plus icon for adding post */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link to="/create" className="hover:text-primary transition-colors flex items-center justify-center h-10 w-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
            <Plus className="h-6 w-6 text-foreground" />
          </Link>
        </motion.div>

        {/* Center: Cursive Logo */}
        <Link to="/" className="font-handwritten text-2xl sm:text-3xl text-foreground font-semibold gradient-text tracking-wide select-none">
          ChatGram
        </Link>

        {/* Right: Theme Toggle & Heart notification icon */}
        <div className="flex items-center gap-1.5 relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hover:text-primary transition-colors flex items-center justify-center h-10 w-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-foreground"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowNotifications(prev => !prev);
              setIsSearchOpen(false);
            }}
            className="hover:text-primary transition-colors flex items-center justify-center h-10 w-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-foreground relative"
          >
            <Heart className={`h-5.5 w-5.5 ${notifications.some(n => n.type === 'request' && n.status === 'pending') ? 'text-pink-500 fill-pink-500 animate-pulse-icon' : 'text-foreground'}`} />
            {notifications.some(n => n.type === 'request' && n.status === 'pending') && (
              <span className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full bg-pink-500" />
            )}
          </motion.button>

          {/* Friend Request/Notification Dropdown Overlay */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-black/10 dark:border-white/5 bg-card/95 backdrop-blur-xl p-3 shadow-xl z-50 space-y-2"
              >
                <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground/80 pl-1">Notifications</h3>
                <div className="divide-y divide-black/5 dark:divide-white/5 max-h-60 overflow-y-auto pr-1">
                  {notifications.map(n => (
                    <div key={n.id} className="flex gap-2.5 py-2 items-start text-xs border-b border-black/5 dark:border-white/5 last:border-b-0">
                      <img src={n.avatar} className="h-7 w-7 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="leading-snug text-foreground/90">
                          <span className="font-semibold text-foreground">@{n.username}</span> {n.type === 'request' ? (n.status === 'pending' ? 'sent you a friend request' : n.detail) : n.detail}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60">{n.time}</span>
                        
                        {n.type === 'request' && n.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" className="h-7 px-3 bg-pink-500 text-white rounded-lg text-[10px] font-bold" onClick={() => handleAcceptRequest(n.id)}>
                              Confirm
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-3 rounded-lg text-[10px] font-bold" onClick={() => handleDeclineRequest(n.id)}>
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Slide-down Search Input - Mobile/Tablet Only */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, cubicBezier: [0.16, 1, 0.3, 1] }}
            className="border-b border-black/10 dark:border-white/5 bg-card/65 backdrop-blur-xl px-4 py-3 overflow-hidden shadow-inner relative z-40 lg:hidden"
          >
            <div className="mx-auto max-w-lg">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={handleSearchChange}
                  className="pr-10 bg-background/50 border-white/10 dark:border-white/5 backdrop-blur-md rounded-xl text-sm"
                  autoFocus
                  autoComplete="off"
                />
                <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0 h-full hover:bg-transparent">
                  <Search className="h-4.5 w-4.5 text-muted-foreground" />
                </Button>
              </form>

              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 rounded-xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-lg p-1 max-h-48 overflow-y-auto"
                >
                  {results.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left rounded-lg hover:bg-primary/10 transition-colors"
                      onClick={() => handleResultClick(user.username)}
                    >
                      <img src={user.avatarUrl} alt={user.username} className="h-6 w-6 rounded-full object-cover" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs sm:text-sm">{user.displayName}</span>
                        <span className="text-[10px] text-muted-foreground">@{user.username}</span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed/Floating Bottom Dock Navigation - Mobile/Tablet Only */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md border border-white/10 dark:border-white/5 bg-card/65 backdrop-blur-xl rounded-2xl shadow-2xl p-2 flex items-center justify-around lg:hidden">
        {/* Home Button */}
        <motion.div whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}>
          <Link 
            to="/" 
            className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all ${isHomeActive ? 'text-primary bg-primary/10 shadow-inner' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <HomeIcon className="h-5.5 w-5.5" />
          </Link>
        </motion.div>

        {/* Search Toggle Button */}
        <motion.div whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}>
          <button 
            onClick={toggleSearch}
            className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all ${isSearchOpen ? 'text-primary bg-primary/10 shadow-inner' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Search className="h-5.5 w-5.5" />
          </button>
        </motion.div>

        {/* Loops Button */}
        <motion.div whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}>
          <button 
            onClick={showLoopsToast}
            className="flex items-center justify-center h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground transition-all"
          >
            <Clapperboard className="h-5.5 w-5.5" />
          </button>
        </motion.div>

        {/* Message Button */}
        <motion.div whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}>
          <Link 
            to="/messages"
            className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all ${isMessagesActive ? 'text-primary bg-primary/10 shadow-inner font-bold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <MessageSquare className="h-5.5 w-5.5" />
          </Link>
        </motion.div>

        {/* Profile Button */}
        <motion.div whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}>
          <Link 
            to={`/profile/${currentUser?.username}`}
            className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all ${isProfileActive ? 'text-primary bg-primary/10 shadow-inner ring-2 ring-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <User className="h-5.5 w-5.5" />
          </Link>
        </motion.div>
      </nav>
    </>
  );
};

export default Navbar;
