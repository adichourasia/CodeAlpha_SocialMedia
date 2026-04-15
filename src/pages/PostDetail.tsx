import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import PostCard from '@/components/PostCard';
import { ArrowLeft } from 'lucide-react';

const PostDetail = () => {
  const { postId } = useParams();
  const { posts } = useStore();
  const navigate = useNavigate();

  const post = posts.find(p => p.id === postId);
  if (!post) return <div className="p-8 text-center text-muted-foreground">Post not found</div>;

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
