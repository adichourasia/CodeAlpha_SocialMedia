import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { getRandomFeedImageUrl } from '@/lib/post-image';

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPost } = useStore();
  const navigate = useNavigate();
  const previewImageUrl = image.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
    await createPost(content.trim(), image.trim() || undefined);
      toast.success('Post created!');
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create post';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="font-heading text-2xl font-bold">Create Post</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={5}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ImagePlus className="h-4 w-4" /> Image URL (optional)
          </label>
          <input value={image} onChange={e => setImage(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="https://example.com/image.jpg" />
          {previewImageUrl ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted">
              <img
                src={previewImageUrl}
                alt="Preview"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  event.currentTarget.src = getRandomFeedImageUrl(previewImageUrl);
                }}
                className="h-48 w-full object-cover"
              />
            </div>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={!content.trim() || isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Post'}
        </Button>
      </form>
    </div>
  );
};

export default CreatePost;
