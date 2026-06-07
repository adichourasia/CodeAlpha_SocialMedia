import { Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRealAvatarUrl } from '@/lib/avatar';
import { useState } from 'react';
import { motion } from 'framer-motion';

const RightSidebar = () => {
  const { currentUser } = useStore();

  const [suggestions, setSuggestions] = useState([
    { id: 101, username: 'tech_wizard', name: 'Tech Wizard', avatar: 'https://ui-avatars.com/api/?name=Tech+Wizard&background=10b981&color=fff', following: false },
    { id: 102, username: 'photo_nomad', name: 'Photo Nomad', avatar: 'https://ui-avatars.com/api/?name=Photo+Nomad&background=3b82f6&color=fff', following: false },
    { id: 103, username: 'baker_delight', name: 'Baker Delight', avatar: 'https://ui-avatars.com/api/?name=Baker+Delight&background=f59e0b&color=fff', following: false }
  ]);

  const toggleFollowSuggestion = (id: number) => {
    setSuggestions(prev =>
      prev.map(s => s.id === id ? { ...s, following: !s.following } : s)
    );
  };

  if (!currentUser) return null;

  return (
    <aside className="hidden xl:flex flex-col w-72 sticky top-0 h-screen p-6 space-y-6 bg-transparent shrink-0">
      {/* Current User Snapshot */}
      <div className="flex items-center justify-between p-1 bg-white/5 dark:bg-black/5 rounded-2xl backdrop-blur-sm border border-black/5 dark:border-white/5 p-3.5">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${currentUser.username}`}>
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={getRealAvatarUrl(currentUser.username, currentUser.avatarUrl)} alt={currentUser.displayName} />
              <AvatarFallback>{currentUser.displayName[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col min-w-0">
            <Link to={`/profile/${currentUser.username}`} className="font-heading font-semibold text-sm hover:text-primary truncate">
              {currentUser.displayName}
            </Link>
            <span className="text-xs text-muted-foreground truncate">@{currentUser.username}</span>
          </div>
        </div>
        <Link to={`/profile/${currentUser.username}`} className="text-xs font-bold text-primary hover:underline pr-1">
          View
        </Link>
      </div>

      {/* Suggested Users */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between pl-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Suggested for you</span>
          <span className="text-[11px] font-bold text-foreground/85 hover:text-primary cursor-pointer transition-colors">See All</span>
        </div>

        <div className="space-y-3">
          {suggestions.map(s => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 ring-1 ring-primary/10">
                  <AvatarImage src={s.avatar} alt={s.username} />
                  <AvatarFallback>{s.displayName?.[0] || s.username[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-foreground/95 hover:text-primary cursor-pointer truncate">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate">@{s.username}</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleFollowSuggestion(s.id)}
                className={`font-bold text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
                  s.following ? 'bg-muted/70 text-foreground border border-black/5 dark:border-white/5' : 'text-primary hover:text-primary/80'
                }`}
              >
                {s.following ? 'Following' : 'Follow'}
              </motion.button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-black/5 dark:border-white/5 text-[10px] text-muted-foreground/60 leading-relaxed pl-1 space-y-2.5">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <span className="hover:underline cursor-pointer">About</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Help</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Press</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">API</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Jobs</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Privacy</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Terms</span>
        </div>
        <p className="font-medium">© 2026 CHATGRAM FROM ADVANCED CODING TEAM</p>
      </div>
    </aside>
  );
};

export default RightSidebar;
