import { useStore } from '@/lib/store';
import PostCard from '@/components/PostCard';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Home = () => {
  const { posts, currentUser } = useStore();

  // Show posts from followed users + own posts, sorted by date
  const feedPosts = posts
    .filter(p => currentUser?.following.includes(p.authorId) || p.authorId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allPosts = posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-16 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-heading text-lg font-bold">Feed</h1>
          <Button size="sm" asChild>
            <Link to="/create"><PlusCircle className="mr-1.5 h-4 w-4" /> New Post</Link>
          </Button>
        </div>
      </div>

      {feedPosts.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-muted-foreground">Your feed is empty. Follow some people to see their posts!</p>
          <div className="mt-6 space-y-1">
            <p className="text-xs font-heading font-semibold text-muted-foreground">Explore all posts</p>
          </div>
        </div>
      ) : null}

      {(feedPosts.length > 0 ? feedPosts : allPosts).map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default Home;
