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

const Profile = () => {
  const { username } = useParams();
  const { currentUser, toggleFollow, loadProfile, loadProfilePosts } = useStore();
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
    <div className="mx-auto max-w-2xl px-3 sm:px-0">
      <div className="border-b border-border p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarImage src={getRealAvatarUrl(user.username, user.avatarUrl)} alt={user.displayName} />
            <AvatarFallback className="text-2xl">{user.displayName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="font-heading text-lg font-bold sm:text-xl">{user.displayName}</h1>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isOwnProfile ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/edit-profile"><Settings className="mr-1.5 h-4 w-4" /> Edit</Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={isFollowing ? 'outline' : 'default'}
                    onClick={handleToggleFollow}
                    disabled={isTogglingFollow}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInstallPwa}
                  disabled={isInstalled}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  {isInstalled ? 'Installed' : canInstall ? 'Download PWA' : 'Download App'}
                </Button>
              </div>
            </div>
            <p className="mt-2 text-sm">{user.bio}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm sm:gap-4">
              <Link to={`/profile/${user.username}/followers`} className="hover:underline">
                <span className="font-semibold">{stats.followerCount}</span> <span className="text-muted-foreground">followers</span>
              </Link>
              <Link to={`/profile/${user.username}/following`} className="hover:underline">
                <span className="font-semibold">{stats.followingCount}</span> <span className="text-muted-foreground">following</span>
              </Link>
              <span><span className="font-semibold">{stats.postCount}</span> <span className="text-muted-foreground">posts</span></span>
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
