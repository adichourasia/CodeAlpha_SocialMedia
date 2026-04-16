import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { useStore, Post } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from '@/lib/time';
import { toast } from 'sonner';
import { getRealAvatarUrl } from '@/lib/avatar';
import { getRealAvatarUrl as getRealPhotoUrl } from '@/lib/avatar';

interface PostCardProps {
  post: Post;
  showComments?: boolean;
  onDeleted?: () => void;
}

const PostCard = ({ post, showComments = false, onDeleted }: PostCardProps) => {
  const { currentUser, toggleLike, addComment, loadComments, deletePost, deleteComment } = useStore();
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [showAllComments, setShowAllComments] = useState(showComments);
  const [postImageSrc, setPostImageSrc] = useState(post.imageUrl);

  useEffect(() => {
    if (!showAllComments) return;
    if (post.comments.length > 0) return;

    loadComments(post.id).catch((error) => {
      const message = error instanceof Error ? error.message : 'Failed to load comments';
      toast.error(message);
    });
  }, [showAllComments, post.id, post.comments.length, loadComments]);

  useEffect(() => {
    setPostImageSrc(post.imageUrl);
  }, [post.imageUrl]);

  const isLiked = post.likedByMe;

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      await addComment(post.id, commentText.trim());
      setCommentText('');
      setShowAllComments(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add comment';
      toast.error(message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleToggleLike = async () => {
    setIsTogglingLike(true);
    try {
      await toggleLike(post.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update like';
      toast.error(message);
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleDeletePost = async () => {
    setIsDeletingPost(true);
    try {
      await deletePost(post.id);
      onDeleted?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete post';
      toast.error(message);
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(post.id, commentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete comment';
      toast.error(message);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border bg-card p-4"
    >
      <div className="flex gap-3">
        <Link to={`/profile/${post.author.username}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={getRealAvatarUrl(post.author.username, post.author.avatarUrl)} alt={post.author.displayName} />
            <AvatarFallback>{post.author.displayName[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${post.author.username}`} className="font-heading text-sm font-semibold hover:underline">
                {post.author.displayName}
              </Link>
              <span className="text-xs text-muted-foreground">@{post.author.username}</span>
              <span className="text-xs text-muted-foreground">· {formatDistanceToNow(post.createdAt)}</span>
            </div>
            {currentUser?.id === post.author.id ? (
              <button
                onClick={handleDeletePost}
                disabled={isDeletingPost}
                className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60"
                aria-label="Delete post"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <Link to={`/post/${post.id}`}>
            <p className="mt-1 text-sm leading-relaxed">{post.content}</p>
            {postImageSrc && (
              <img
                src={postImageSrc}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setPostImageSrc(getRealPhotoUrl(post.id, ''))}
                className="mt-3 w-full rounded-lg object-cover"
                style={{ maxHeight: 400 }}
              />
            )}
          </Link>

          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={handleToggleLike}
              disabled={isTogglingLike}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary disabled:opacity-60"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary animate-like-pop' : ''}`} />
              <span>{post.likeCount}</span>
            </button>
            <button onClick={() => setShowAllComments(!showAllComments)} className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent">
              <MessageCircle className="h-4 w-4" />
              <span>{post.commentCount}</span>
            </button>
          </div>

          {showAllComments && (
            <div className="mt-3 space-y-3">
              {post.comments.map(comment => {
                return (
                  <div key={comment.id} className="flex gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getRealAvatarUrl(comment.author.username, comment.author.avatarUrl)} />
                      <AvatarFallback>{comment.author.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 rounded-lg bg-muted p-2">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-xs font-semibold">{comment.author.displayName}</span>
                        {currentUser?.id === comment.author.id ? (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  disabled={!currentUser}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                <Button type="submit" size="sm" disabled={!commentText.trim() || !currentUser || isSubmittingComment}>
                  {isSubmittingComment ? 'Posting...' : 'Post'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default PostCard;
