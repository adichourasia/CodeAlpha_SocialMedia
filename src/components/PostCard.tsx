import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Trash2, MoreHorizontal } from 'lucide-react';
import { useStore, Post } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from '@/lib/time';

interface PostCardProps {
  post: Post;
  showComments?: boolean;
}

const PostCard = ({ post, showComments = false }: PostCardProps) => {
  const { currentUser, toggleLike, addComment, deleteComment, deletePost, getUserById } = useStore();
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(showComments);

  const author = getUserById(post.authorId);
  if (!author) return null;

  const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
  const isOwner = currentUser?.id === post.authorId;

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText('');
    setShowAllComments(true);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border bg-card p-4"
    >
      <div className="flex gap-3">
        <Link to={`/profile/${author.username}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.avatar} alt={author.displayName} />
            <AvatarFallback>{author.displayName[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${author.username}`} className="font-heading text-sm font-semibold hover:underline">
                {author.displayName}
              </Link>
              <span className="text-xs text-muted-foreground">@{author.username}</span>
              <span className="text-xs text-muted-foreground">· {formatDistanceToNow(post.createdAt)}</span>
            </div>
            {isOwner && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => deletePost(post.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Link to={`/post/${post.id}`}>
            <p className="mt-1 text-sm leading-relaxed">{post.content}</p>
            {post.image && (
              <img src={post.image} alt="" className="mt-3 w-full rounded-lg object-cover" style={{ maxHeight: 400 }} />
            )}
          </Link>

          <div className="mt-3 flex items-center gap-4">
            <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary animate-like-pop' : ''}`} />
              <span>{post.likes.length}</span>
            </button>
            <button onClick={() => setShowAllComments(!showAllComments)} className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments.length}</span>
            </button>
          </div>

          {showAllComments && (
            <div className="mt-3 space-y-3">
              {post.comments.map(comment => {
                const commentAuthor = getUserById(comment.authorId);
                return (
                  <div key={comment.id} className="flex gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={commentAuthor?.avatar} />
                      <AvatarFallback>{commentAuthor?.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 rounded-lg bg-muted p-2">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-xs font-semibold">{commentAuthor?.displayName}</span>
                        {currentUser?.id === comment.authorId && (
                          <button onClick={() => deleteComment(post.id, comment.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
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
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                <Button type="submit" size="sm" disabled={!commentText.trim()}>Post</Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default PostCard;
