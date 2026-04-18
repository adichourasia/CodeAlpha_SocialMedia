import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import PostCard from '@/components/PostCard';
import { Link } from 'react-router-dom';
import { Compass, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getRandomFeedImageUrl } from '@/lib/post-image';

const EXPLORE_TOPICS = [
  'Sunrise routines',
  'Weekend escapes',
  'Desk setup inspo',
  'City lights',
  'Coffee breaks',
  'Quiet playlists',
  'Street photography',
  'Motion and color',
  'Creative sparks',
  'Late-night thoughts',
  'Travel moods',
  'Work in progress',
];

const EXPLORE_SEED_PREFIX = 'chatgram-explore';

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
        setHasMore(false);
      });
  }, [loadPosts]);

  const exploreCards = EXPLORE_TOPICS.map((topic, index) => {
    const seed = `${EXPLORE_SEED_PREFIX}-${index}-${topic}`;
    const imageUrl = getRandomFeedImageUrl(seed);
    const compact = index % 3 === 0;

    return {
      id: seed,
      topic,
      imageUrl,
      blurb: compact
        ? 'Fresh inspiration from the community.'
        : 'A random visual to keep the feed alive before posts exist.',
      heightClass: compact ? 'h-40 sm:h-52' : 'h-56 sm:h-72',
    };
  });

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
        <div className="space-y-4 px-4 py-6 sm:py-8">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Compass className="h-4 w-4" />
            <span>Explore feed</span>
          </div>
          <div className="space-y-3">
            {exploreCards.map((card) => (
              <article
                key={card.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className={`relative ${card.heightClass}`}>
                  <img
                    src={card.imageUrl}
                    alt={card.topic}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">Suggested</p>
                    <h2 className="mt-1 font-heading text-lg font-semibold">{card.topic}</h2>
                    <p className="mt-1 text-sm text-white/80">{card.blurb}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      <div ref={sentinelRef} className="h-8" />
      {isFetchingMore ? <p className="pb-8 text-center text-xs text-muted-foreground">Loading more...</p> : null}
    </div>
  );
};

export default Home;
