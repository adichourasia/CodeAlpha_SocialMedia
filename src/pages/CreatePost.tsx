import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImagePlus, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRandomFeedImageUrl } from '@/lib/post-image';

const TONES = [
  { id: 'creative', name: 'Creative', icon: '🔮' },
  { id: 'inspirational', name: 'Inspirational', icon: '🌟' },
  { id: 'humorous', name: 'Humorous', icon: '😜' },
  { id: 'professional', name: 'Professional', icon: '💼' },
  { id: 'aesthetic', name: 'Aesthetic', icon: '📝' }
];

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('creative');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  const { createPost, generateCaptions } = useStore();
  const navigate = useNavigate();
  const previewImageUrl = image.trim();

  const handleGenerateCaptions = async () => {
    setIsGenerating(true);
    try {
      const results = await generateCaptions(aiPrompt, aiTone);
      setAiSuggestions(results);
      toast.success('Captions generated!');
    } catch (err) {
      toast.error('Failed to generate captions. Make sure the backend server is running.');
    } finally {
      setIsGenerating(false);
    }
  };

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

        {/* AI Caption Helper Trigger */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsAiOpen(!isAiOpen)}
            className="flex items-center gap-1.5 rounded-full border border-primary/20 hover:border-primary/50 text-[11px] font-semibold bg-primary/5 text-primary hover:bg-primary/10 transition-all shadow-sm px-3.5 py-1.5"
          >
            <Sparkles className="h-3 w-3 animate-pulse" />
            {isAiOpen ? 'Close AI Assistant' : '✨ AI Caption Assistant'}
          </button>
        </div>

        {/* AI Caption Helper Panel */}
        {isAiOpen && (
          <div className="rounded-xl border border-primary/15 bg-card/65 backdrop-blur-xl p-4 space-y-4 shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
              <Sparkles className="h-4 w-4 text-primary animate-spin-slow" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">AI Caption Assistant</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">What is this post about? (e.g. coffee by the beach)</label>
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Enter keywords or topic..."
                  className="mt-1.5 w-full rounded-xl border border-input/60 bg-background/50 px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/40"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 block mb-1.5">Select Mood / Tone</label>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAiTone(t.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                        aiTone === t.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.03]'
                          : 'bg-background/40 text-muted-foreground border-input/65 hover:bg-background/70 hover:text-foreground'
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGenerateCaptions}
                disabled={isGenerating}
                className="w-full text-xs font-bold gradient-btn flex items-center justify-center gap-1.5 rounded-xl py-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    AI is brainstorming...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5" />
                    Generate Creative Captions
                  </>
                )}
              </Button>
            </div>

            {aiSuggestions.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-primary/10">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 block">Generated Suggestions</label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {aiSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl border border-black/5 dark:border-white/5 bg-background/45 hover:bg-background/80 transition-all flex flex-col gap-2 relative group"
                    >
                      <p className="text-xs text-foreground/90 leading-relaxed font-medium">{suggestion}</p>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setContent(suggestion);
                            toast.success('Caption applied!');
                            setIsAiOpen(false);
                          }}
                          className="text-[10px] font-bold h-7 px-2.5 rounded-lg flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary transition-colors border-none"
                        >
                          Use this Caption
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
