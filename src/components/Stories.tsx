import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { getRealAvatarUrl } from '@/lib/avatar';

const Stories = () => {
  const { 
    currentUser, 
    stories, 
    setActiveStoryUser, 
    addStory 
  } = useStore();

  // Dialog/Form for creating a story
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [storyImageUrl, setStoryImageUrl] = useState('');
  const [storyCaption, setStoryCaption] = useState('');

  const handleShareStory = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultImage = 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&auto=format&fit=crop&q=80';
    const finalImageUrl = storyImageUrl.trim() || defaultImage;
    const finalCaption = storyCaption.trim() || 'Just shared a story! ✨';

    addStory(finalImageUrl, finalCaption);
    toast.success('Story shared successfully!');
    setShowCreateStory(false);
    setStoryImageUrl('');
    setStoryCaption('');
  };

  const currentUserStory = stories.find(s => s.username === currentUser?.username);

  return (
    <div className="w-full py-4 border-b border-black/5 dark:border-white/5 bg-card/20 backdrop-blur-md px-4 select-none relative z-30">
      <div className="flex gap-4 overflow-x-auto no-scrollbar items-center py-1">
        {/* Current User story circle */}
        {currentUser && (
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="relative group">
              {currentUserStory ? (
                <div 
                  onClick={() => setActiveStoryUser(currentUser.username)}
                  className={`p-[2.5px] rounded-full cursor-pointer transition-transform hover:scale-[1.03] active:scale-95 ${
                    currentUserStory.viewed ? 'border-2 border-muted-foreground/30' : 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600'
                  }`}
                >
                  <Avatar className="h-14 w-14 ring-2 ring-background shadow-md">
                    <AvatarImage src={getRealAvatarUrl(currentUser.username, currentUser.avatarUrl)} />
                    <AvatarFallback className="bg-primary/20 text-foreground font-bold">{currentUser.displayName[0]}</AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <div 
                  onClick={() => setShowCreateStory(true)}
                  className="p-[2.5px] rounded-full cursor-pointer transition-transform hover:scale-[1.03] active:scale-95 border-2 border-dashed border-muted-foreground/40"
                >
                  <Avatar className="h-14 w-14 ring-2 ring-background opacity-85">
                    <AvatarImage src={getRealAvatarUrl(currentUser.username, currentUser.avatarUrl)} />
                    <AvatarFallback className="bg-primary/20 text-foreground font-bold">{currentUser.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 bg-primary text-white h-5 w-5 rounded-full flex items-center justify-center border-2 border-card text-xs shadow-md">
                    <Plus className="h-3 w-3 stroke-[3]" />
                  </span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground truncate w-14 text-center">Your Story</span>
          </div>
        )}

        {/* Other users stories */}
        {stories
          .filter(s => s.username !== currentUser?.username)
          .map(story => (
            <div 
              key={story.username}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div 
                onClick={() => setActiveStoryUser(story.username)}
                className={`p-[2.5px] rounded-full cursor-pointer transition-transform hover:scale-[1.03] active:scale-95 ${
                  story.viewed ? 'border-2 border-muted-foreground/30' : 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600'
                }`}
              >
                <Avatar className="h-14 w-14 ring-2 ring-background shadow-md">
                  <AvatarImage src={story.avatarUrl} alt={story.displayName} />
                  <AvatarFallback className="bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-bold">{story.displayName[0]}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[10px] font-medium text-foreground/80 truncate w-14 text-center">@{story.username}</span>
            </div>
          ))}
      </div>

      {/* Story Creator Modal Overlay */}
      <AnimatePresence>
        {showCreateStory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-white/5 bg-card p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                <h3 className="font-heading font-bold text-base text-foreground">Create a Story</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setShowCreateStory(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleShareStory} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Story Photo URL (optional)</label>
                  <Input 
                    type="text" 
                    placeholder="https://images.unsplash.com/..." 
                    value={storyImageUrl} 
                    onChange={e => setStoryImageUrl(e.target.value)}
                    className="rounded-xl border-input/60 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Caption / Status</label>
                  <Input 
                    type="text" 
                    placeholder="Morning walk vibes... 🌲✨" 
                    value={storyCaption} 
                    onChange={e => setStoryCaption(e.target.value)}
                    required
                    maxLength={60}
                    className="rounded-xl border-input/60 text-xs"
                  />
                </div>

                <Button type="submit" className="w-full gradient-btn rounded-xl text-xs font-semibold py-2.5 shadow-md border-none">
                  Share to ChatGram
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Stories;
