import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import PostCard from '@/components/PostCard';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Home = () => {
  const { posts, loadPosts, isLoadingPosts } = useStore();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    loadPosts({ limit: 10, offset: 0, reset: true })
      .then((result) => setHasMore(result.hasMore))
      .catch((error) => {
      const message = error instanceof Error ? error.message : 'Failed to load feed';
      toast.error(message);
      });
  }, [loadPosts]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting || isLoadingPosts || isFetchingMore) return;

      setIsFetchingMore(true);
      loadPosts({ limit: 10, offset: posts.length, reset: false })
        .then((result) => setHasMore(result.hasMore))
        .catch((error) => {
          const message = error instanceof Error ? error.message : 'Failed to load more posts';
          toast.error(message);
        })
        .finally(() => setIsFetchingMore(false));
    }, { rootMargin: '200px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, isLoadingPosts, loadPosts, posts.length]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-14 z-40 border-b border-border bg-card/80 backdrop-blur-lg sm:top-16">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary/10 ring-1 ring-primary/15 sm:h-12 sm:w-12">
              <img src="/logo.png" alt="ChatGram" className="h-full w-full scale-[1.45] object-contain" />
            </span>
            <h1 className="font-heading text-base font-bold sm:text-lg">Feed</h1>
          </div>
          <Button size="sm" asChild>
            <Link to="/create"><PlusCircle className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">New Post</span></Link>
          </Button>
        </div>
      </div>

      {isLoadingPosts ? (
        <div className="px-4 py-16 text-center">
          <p className="text-muted-foreground">Loading feed...</p>
        </div>
      ) : null}

      {!isLoadingPosts && posts.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-muted-foreground">No posts yet. Be the first to share something.</p>
        </div>
      ) : null}

      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}

      <div ref={sentinelRef} className="h-8" />
      {isFetchingMore ? <p className="pb-8 text-center text-xs text-muted-foreground">Loading more...</p> : null}
    </div>
  );
};

export default Home;
