import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore, Post, ProfileData } from '@/lib/store';
import PostCard from '@/components/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Download, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { getRealAvatarUrl } from '@/lib/avatar';
import { usePwaInstall } from '@/lib/pwa';
import { motion } from 'framer-motion';

const Profile = () => {
  const { username } = useParams();
  const { currentUser, toggleFollow, loadProfile, loadProfilePosts, stories, setActiveStoryUser } = useStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isFetchingMorePosts, setIsFetchingMorePosts] = useState(false);
  const postsSentinelRef = useRef<HTMLDivElement | null>(null);
  const { canInstall, isInstalled, triggerInstall } = usePwaInstall();

  useEffect(() => {
    if (!username) return;

    setIsLoading(true);
    Promise.all([
      loadProfile(username),
      loadProfilePosts(username, { limit: 6, offset: 0, reset: true }),
    ])
      .then(([profileResponse, postsResponse]) => {
        setProfile(profileResponse);
        setPosts(postsResponse.posts);
        setHasMorePosts(postsResponse.hasMore);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to load profile';
        toast.error(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [username, loadProfile, loadProfilePosts]);

  useEffect(() => {
    const node = postsSentinelRef.current;
    if (!node || !hasMorePosts || !username) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting || isLoading || isFetchingMorePosts) return;

      setIsFetchingMorePosts(true);
      loadProfilePosts(username, { limit: 6, offset: posts.length, reset: false })
        .then((result) => {
          setPosts((currentPosts) => [...currentPosts, ...result.posts]);
          setHasMorePosts(result.hasMore);
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : 'Failed to load more posts';
          toast.error(message);
        })
        .finally(() => setIsFetchingMorePosts(false));
    }, { rootMargin: '200px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMorePosts, isFetchingMorePosts, isLoading, loadProfilePosts, posts.length, username]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-center text-muted-foreground">User not found</div>;

  const { user, stats } = profile;
  const isOwnProfile = currentUser?.id === user.id;
  const isFollowing = profile.isFollowing;

  const handleInstallPwa = async () => {
    const result = await triggerInstall();

    if (!result.available) {
      toast.info('Install prompt is not available yet. Keep using the app for a few seconds and try again.');
      return;
    }

    if (result.outcome === 'accepted') {
      toast.success('ChatGram install started.');
      return;
    }

    toast.info('Install was dismissed. You can try again anytime from this button.');
  };

  const handleToggleFollow = async () => {
    if (!username) return;
    setIsTogglingFollow(true);
    const previousProfile = profile;
    const nextFollowing = !profile?.isFollowing;

    if (profile) {
      setProfile({
        ...profile,
        isFollowing: nextFollowing,
        stats: {
          ...profile.stats,
          followerCount: profile.stats.followerCount + (nextFollowing ? 1 : -1),
        },
      });
    }

    try {
      const following = await toggleFollow(username);
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isFollowing: following,
          stats: {
            ...prev.stats,
            followerCount: previousProfile ? previousProfile.stats.followerCount + (following ? 1 : -1) : prev.stats.followerCount,
          },
        };
      });
    } catch (error) {
      if (previousProfile) {
        setProfile(previousProfile);
      }
      const message = error instanceof Error ? error.message : 'Failed to update follow state';
      toast.error(message);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-2 sm:px-0">
      {/* Decorative Header Banner */}
      <div className="relative w-full h-28 sm:h-40 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 rounded-b-2xl overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Profile Info Glass Panel */}
      <div className="relative z-10 -mt-12 px-4 pb-6 border-b border-black/5 dark:border-white/5 glass-card rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {stories.some(s => s.username === user.username) ? (
            <div 
              onClick={() => setActiveStoryUser(user.username)}
              className={`p-[3px] rounded-full cursor-pointer transition-all hover:scale-105 ${
                stories.find(s => s.username === user.username)?.viewed 
                  ? 'border-2 border-muted-foreground/30' 
                  : 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600'
              }`}
            >
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-background shadow-xl rounded-full">
                <AvatarImage src={getRealAvatarUrl(user.username, user.avatarUrl)} alt={user.displayName} />
                <AvatarFallback className="text-3xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-bold">{user.displayName[0]}</AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-background shadow-xl rounded-full">
              <AvatarImage src={getRealAvatarUrl(user.username, user.avatarUrl)} alt={user.displayName} />
              <AvatarFallback className="text-3xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-bold">{user.displayName[0]}</AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 w-full">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-2">
              <div className="min-w-0">
                <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">{user.displayName}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground/90 font-medium">@{user.username}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isOwnProfile ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 dark:border-white/5 bg-background/50 backdrop-blur-md">
                      <Link to="/edit-profile"><Settings className="mr-1.5 h-4 w-4" /> Edit</Link>
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    <Button
                      size="sm"
                      variant={isFollowing ? 'outline' : 'default'}
                      onClick={handleToggleFollow}
                      disabled={isTogglingFollow}
                      className={`rounded-xl px-4 transition-all duration-300 font-semibold ${!isFollowing ? 'gradient-btn border-none' : 'border-white/20'}`}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInstallPwa}
                    disabled={isInstalled}
                    className="w-full sm:w-auto rounded-xl border-white/10 dark:border-white/5 bg-background/50 backdrop-blur-md"
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    {isInstalled ? 'Installed' : canInstall ? 'Download PWA' : 'Download App'}
                  </Button>
                </motion.div>
              </div>
            </div>
            <p className="mt-3 text-sm text-foreground/85 leading-relaxed">{user.bio || "No bio yet."}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs sm:text-sm pt-3 border-t border-black/5 dark:border-white/5">
              <Link to={`/profile/${user.username}/followers`} className="hover:text-primary transition-colors">
                <span className="font-semibold text-foreground">{stats.followerCount}</span> <span className="text-muted-foreground/80">followers</span>
              </Link>
              <Link to={`/profile/${user.username}/following`} className="hover:text-primary transition-colors">
                <span className="font-semibold text-foreground">{stats.followingCount}</span> <span className="text-muted-foreground/80">following</span>
              </Link>
              <span className="text-muted-foreground/80">
                <span className="font-semibold text-foreground">{stats.postCount}</span> posts
              </span>
            </div>
          </div>
        </div>
      </div>

      {posts.map(post => <PostCard key={post.id} post={post} />)}
      <div ref={postsSentinelRef} className="h-8" />
      {isFetchingMorePosts ? <p className="pb-8 text-center text-xs text-muted-foreground">Loading more...</p> : null}
      {posts.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">No posts yet</p>
      )}
    </div>
  );
};

export default Profile;
