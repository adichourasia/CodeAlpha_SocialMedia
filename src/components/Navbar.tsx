
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Home, PlusCircle, User as UserIcon, LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useRef } from 'react';

const Navbar = () => {

  const { currentUser, isAuthenticated, logout, searchUsers } = useStore();
  const navigate = useNavigate();

  // Search state
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Array<{ id: number; username: string; displayName: string; avatarUrl: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

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
      setShowDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      const users = await searchUsers(value);
      setResults(users);
      setShowDropdown(true);
    }, 300);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    const users = await searchUsers(search);
    setResults(users);
    setShowDropdown(true);
  };

  const handleResultClick = (username: string) => {
    setSearch('');
    setResults([]);
    setShowDropdown(false);
    navigate(`/profile/${username}`);
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
        <form onSubmit={handleSearchSubmit} className="relative mr-2 w-40 sm:w-56">
          <Input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={handleSearchChange}
            onFocus={() => search && setShowDropdown(true)}
            className="pr-8"
            autoComplete="off"
          />
          <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0 h-full">
            <Search className="h-4 w-4" />
          </Button>
          {showDropdown && results.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
              {results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                  onClick={() => handleResultClick(user.username)}
                >
                  <img src={user.avatarUrl} alt={user.username} className="h-6 w-6 rounded-full object-cover" />
                  <span className="font-medium">{user.displayName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">@{user.username}</span>
                </button>
              ))}
            </div>
          )}
        </form>
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
