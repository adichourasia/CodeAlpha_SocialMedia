import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import PostCard from '@/components/PostCard';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const PostDetail = () => {
  const { postId } = useParams();
  const { loadPost } = useStore();
  const navigate = useNavigate();
  const numericPostId = Number(postId);
  const [isLoading, setIsLoading] = useState(true);
  const [postNotFound, setPostNotFound] = useState(false);
  const [postIdLoaded, setPostIdLoaded] = useState<number | null>(null);
  const post = useStore((state) => (Number.isNaN(numericPostId) ? undefined : state.getPostById(numericPostId)));

  useEffect(() => {
    if (Number.isNaN(numericPostId)) {
      setIsLoading(false);
      setPostNotFound(true);
      return;
    }

    if (post) {
      setPostIdLoaded(numericPostId);
      setIsLoading(false);
      return;
    }

    if (postIdLoaded === numericPostId) return;

    setIsLoading(true);
    setPostNotFound(false);
    setPostIdLoaded(numericPostId);
    loadPost(numericPostId)
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to load post';
        toast.error(message);
        setPostNotFound(true);
        setPostIdLoaded(null);
      })
      .finally(() => setIsLoading(false));
  }, [loadPost, numericPostId, post, postIdLoaded]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading post...</div>;
  if (postNotFound || !post) return <div className="p-8 text-center text-muted-foreground">Post not found</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="border-b border-border px-4 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
      <PostCard post={post} showComments />
    </div>
  );
};

export default PostDetail;
