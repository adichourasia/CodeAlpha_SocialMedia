import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Home, PlusCircle, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const { currentUser, isAuthenticated, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-3 sm:h-16 sm:px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 ring-1 ring-primary/15 sm:h-14 sm:w-14">
            <img src="/logo.png" alt="ChatGram" className="h-full w-full scale-[1.45] object-contain" />
          </span>
          <span className="hidden font-heading text-xl font-bold text-primary sm:inline">ChatGram</span>
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><Home className="h-5 w-5" /></Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/create"><PlusCircle className="h-5 w-5" /></Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/profile/${currentUser?.username}`}><User className="h-5 w-5" /></Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
