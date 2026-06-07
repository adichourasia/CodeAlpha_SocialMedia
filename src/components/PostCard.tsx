import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { useStore, Post } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from '@/lib/time';
import { toast } from 'sonner';
import { getRealAvatarUrl } from '@/lib/avatar';
import { getRandomFeedImageUrl } from '@/lib/post-image';

interface PostCardProps {
  post: Post;
  showComments?: boolean;
  onDeleted?: () => void;
}

const PostCard = ({ post, showComments = false, onDeleted }: PostCardProps) => {
  const { currentUser, toggleLike, addComment, loadComments, deletePost, deleteComment, stories, setActiveStoryUser } = useStore();
  const navigate = useNavigate();
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [showAllComments, setShowAllComments] = useState(showComments);
  const [postImageSrc, setPostImageSrc] = useState(post.imageUrl);
  const [showHeartPop, setShowHeartPop] = useState(false);

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      handleImageDoubleClick();
    } else {
      clickTimeout.current = setTimeout(() => {
        clickTimeout.current = null;
        navigate(`/post/${post.id}`);
      }, 250);
    }
  };

  const handleImageDoubleClick = async () => {
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 800);
    if (!post.likedByMe) {
      setIsTogglingLike(true);
      try {
        await toggleLike(post.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update like';
        toast.error(message);
      } finally {
        setIsTogglingLike(false);
      }
    }
  };

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, cubicBezier: [0.16, 1, 0.3, 1] }}
      className="animated-gradient-border hover:shadow-xl hover:shadow-primary/5 transition-shadow duration-300 mb-5"
    >
      <div className="relative z-10 p-4 sm:p-5 glass-card rounded-[calc(var(--radius)-1px)]">
        <div className="flex gap-3.5">
          {stories.some(s => s.username === post.author.username) ? (
            <div 
              onClick={(e) => {
                e.preventDefault();
                setActiveStoryUser(post.author.username);
              }}
              className={`p-[2.5px] rounded-full cursor-pointer transition-all hover:scale-105 ${
                stories.find(s => s.username === post.author.username)?.viewed 
                  ? 'border-2 border-muted-foreground/30' 
                  : 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600'
              }`}
            >
              <Avatar className="h-9 w-9 ring-1 ring-background shadow-sm">
                <AvatarImage src={getRealAvatarUrl(post.author.username, post.author.avatarUrl)} alt={post.author.displayName} />
                <AvatarFallback className="bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-bold text-xs">{post.author.displayName[0]}</AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <Link to={`/profile/${post.author.username}`}>
              <Avatar className="h-10 w-10 ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
                <AvatarImage src={getRealAvatarUrl(post.author.username, post.author.avatarUrl)} alt={post.author.displayName} />
                <AvatarFallback className="bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-bold">{post.author.displayName[0]}</AvatarFallback>
              </Avatar>
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                <Link to={`/profile/${post.author.username}`} className="truncate font-heading text-sm font-semibold hover:text-primary transition-colors">
                  {post.author.displayName}
                </Link>
                <span className="max-w-[8rem] truncate text-xs text-muted-foreground/85 sm:max-w-none">@{post.author.username}</span>
                <span className="text-xs text-muted-foreground/60">· {formatDistanceToNow(post.createdAt)}</span>
              </div>
              {currentUser?.id === post.author.id ? (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDeletePost}
                  disabled={isDeletingPost}
                  className="text-muted-foreground/70 transition-colors hover:text-destructive disabled:opacity-60 p-1 rounded-lg hover:bg-destructive/5"
                  aria-label="Delete post"
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              ) : null}
            </div>

            <Link to={`/post/${post.id}`} className="group block">
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{post.content}</p>
            </Link>
            {postImageSrc && (
              <div 
                onClick={handleImageClick}
                className="mt-3 overflow-hidden rounded-xl border border-white/10 shadow-inner max-h-[320px] sm:max-h-[420px] bg-black/5 relative cursor-pointer select-none group"
              >
                <img
                  src={postImageSrc}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setPostImageSrc(getRandomFeedImageUrl(post.id))}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                />
                
                {/* Large animated heart overlay that pops on double-tap */}
                <AnimatePresence>
                  {showHeartPop && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.6, 1.2, 0], opacity: [0, 1, 1, 0] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <Heart className="h-20 w-20 text-pink-500 fill-pink-500 drop-shadow-2xl" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="mt-4 flex items-center gap-5 border-t border-black/5 dark:border-white/5 pt-3">
              <motion.button
                whileTap={{ scale: 1.3 }}
                onClick={handleToggleLike}
                disabled={isTogglingLike}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-60 group"
              >
                <Heart className={`h-4.5 w-4.5 transition-all ${isLiked ? 'fill-pink-500 text-pink-500 animate-like-pop' : 'group-hover:scale-105'}`} />
                <span className={`transition-all ${isLiked ? 'text-pink-500 font-semibold' : ''}`}>{post.likeCount}</span>
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 1.15 }}
                onClick={() => setShowAllComments(!showAllComments)} 
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-purple-500 transition-colors group"
              >
                <MessageCircle className="h-4.5 w-4.5 transition-transform group-hover:scale-105" />
                <span>{post.commentCount}</span>
              </motion.button>
            </div>

            {showAllComments && (
              <div className="mt-4 space-y-3 border-t border-black/5 dark:border-white/5 pt-4">
                {post.comments.map(comment => {
                  return (
                    <div key={comment.id} className="flex gap-2.5 text-sm items-start">
                      <Link to={`/profile/${comment.author.username}`}>
                        <Avatar className="h-7 w-7 ring-1 ring-primary/10">
                          <AvatarImage src={getRealAvatarUrl(comment.author.username, comment.author.avatarUrl)} />
                          <AvatarFallback className="text-[10px] bg-gradient-to-tr from-pink-500 to-purple-600 text-white">{comment.author.displayName[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 rounded-xl bg-muted/40 dark:bg-slate-900/40 border border-black/5 dark:border-white/5 p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-heading text-xs font-semibold text-foreground/95">{comment.author.displayName}</span>
                          {currentUser?.id === comment.author.id ? (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-muted-foreground/60 transition-colors hover:text-destructive hover:bg-destructive/5 p-0.5 rounded"
                              aria-label="Delete comment"
                            >
                              <Trash2 className="h-3 w-3" />
                            </motion.button>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-foreground/80 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
                <form onSubmit={handleComment} className="flex gap-2 mt-2 pt-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    disabled={!currentUser}
                    className="flex-1 rounded-xl border border-input/60 bg-background/50 px-3.5 py-1.5 text-xs sm:text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                  />
                  <Button type="submit" size="sm" className="gradient-btn border-none rounded-xl text-xs" disabled={!commentText.trim() || !currentUser || isSubmittingComment}>
                    {isSubmittingComment ? 'Posting...' : 'Post'}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default PostCard;
