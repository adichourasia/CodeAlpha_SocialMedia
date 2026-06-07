import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Home, Search, Clapperboard, MessageSquare, User, PlusCircle, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface DesktopSidebarProps {
  onSearchToggle: () => void;
  isSearchOpen: boolean;
}

const DesktopSidebar = ({ onSearchToggle, isSearchOpen }: DesktopSidebarProps) => {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isHomeActive = location.pathname === '/';
  const isProfileActive = location.pathname === `/profile/${currentUser?.username}`;
  const isMessagesActive = location.pathname === '/messages';
  const isCreateActive = location.pathname === '/create';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 sticky top-0 h-screen border-r border-black/5 dark:border-white/5 p-6 bg-card/40 backdrop-blur-xl shrink-0">
      {/* Brand cursive title */}
      <Link to="/" className="font-handwritten text-3xl font-semibold gradient-text tracking-wide select-none mb-10 pl-2">
        ChatGram
      </Link>

      {/* Nav links */}
      <div className="flex-1 space-y-3">
        {/* Home */}
        <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              isHomeActive ? 'text-primary bg-primary/10 font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
        </motion.div>

        {/* Search */}
        <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
          <button
            onClick={onSearchToggle}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              isSearchOpen ? 'text-primary bg-primary/10 font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </button>
        </motion.div>

        {/* Loops */}
        <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
          <button
            onClick={() => toast.info('Loops feature is currently in design! Stay tuned.')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <Clapperboard className="h-5 w-5" />
            <span>Loops</span>
          </button>
        </motion.div>

        {/* Messages */}
        <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/messages"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              isMessagesActive ? 'text-primary bg-primary/10 font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span>Messages</span>
          </Link>
        </motion.div>

        {/* Create Post */}
        <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/create"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              isCreateActive ? 'text-primary bg-primary/10 font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <PlusCircle className="h-5 w-5" />
            <span>Create Post</span>
          </Link>
        </motion.div>

        {/* Profile */}
        <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
          <Link
            to={`/profile/${currentUser?.username}`}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              isProfileActive ? 'text-primary bg-primary/10 font-semibold ring-1 ring-primary/25' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>
        </motion.div>
      </div>

      {/* Bottom sidebar actions */}
      <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-2">
        {/* Theme Toggle */}
        <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-5 w-5 text-yellow-500" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-5 w-5 text-indigo-500" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Logout */}
        <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </motion.div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
