import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const GlobalStoryViewer = () => {
  const { 
    currentUser, 
    stories, 
    activeStoryUser, 
    setActiveStoryUser, 
    markStoryAsViewed, 
    sendStoryReply 
  } = useStore();

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const activeIndex = stories.findIndex(s => s.username === activeStoryUser);
  const activeStory = activeIndex !== -1 ? stories[activeIndex] : null;

  // Handle story progress autoplay (5 seconds per story)
  useEffect(() => {
    if (!activeStory) {
      setProgress(0);
      return;
    }

    // Mark story as viewed (only if not already viewed to avoid infinite state update loop)
    if (!activeStory.viewed) {
      setTimeout(() => {
        markStoryAsViewed(activeStory.username);
      }, 0);
    }

    if (isPlaying) {
      const step = 2; // update every 100ms
      const intervalMs = 100;
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNextStory();
            return 0;
          }
          return prev + step;
        });
      }, intervalMs);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [activeStoryUser, isPlaying]);

  const handleNextStory = () => {
    setProgress(0);
    if (activeIndex < stories.length - 1) {
      setActiveStoryUser(stories[activeIndex + 1].username);
    } else {
      setActiveStoryUser(null);
    }
  };

  const handlePrevStory = () => {
    setProgress(0);
    if (activeIndex > 0) {
      setActiveStoryUser(stories[activeIndex - 1].username);
    } else {
      setProgress(0);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStory) return;

    sendStoryReply(activeStory.username, replyText.trim());
    toast.success(`Reply sent directly to @${activeStory.username}!`);
    setReplyText('');
    
    // Briefly pause autoplay to give feedback
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 1200);
  };

  if (!activeStory) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 sm:bg-black/90 backdrop-blur-lg select-none">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="relative w-full h-full sm:h-[90vh] sm:max-h-[820px] sm:w-[420px] sm:rounded-3xl overflow-hidden flex flex-col justify-between bg-zinc-950 text-white shadow-2xl"
        >
          {/* Media Content */}
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <img 
              src={activeStory.mediaUrl} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/60" />
          </div>

          {/* Top Layout Controls */}
          <div className="relative z-30 p-3 sm:p-4 space-y-3">
            {/* Horizontal Progress Bars */}
            <div className="flex gap-1">
              {stories.map((s, idx) => {
                let fill = 0;
                if (idx < activeIndex) fill = 100;
                if (idx === activeIndex) fill = progress;
                return (
                  <div key={s.username} className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-75 ease-linear"
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* User Header Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8.5 w-8.5 ring-1 ring-white/20">
                  <AvatarImage src={activeStory.avatarUrl} />
                  <AvatarFallback className="bg-primary/20 text-white font-bold text-xs">{activeStory.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="font-heading font-semibold text-xs text-white leading-none">{activeStory.displayName}</span>
                  <span className="text-[9px] text-white/70 mt-0.5">@{activeStory.username}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
                  onClick={() => setActiveStoryUser(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Story Middle navigation buttons (for large desktop users) */}
          <div className="absolute top-[80px] bottom-[120px] left-0 w-1/4 z-20 flex items-center justify-start pl-2">
            <Button 
              size="icon" 
              variant="ghost" 
              className="hidden sm:flex h-9 w-9 bg-black/40 hover:bg-black/60 rounded-full text-white border border-white/5 opacity-40 hover:opacity-100 transition-opacity"
              onClick={handlePrevStory}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {/* Mobile Tap Target */}
            <div className="sm:hidden absolute inset-0 cursor-pointer" onClick={handlePrevStory} />
          </div>
          <div className="absolute top-[80px] bottom-[120px] right-0 w-1/4 z-20 flex items-center justify-end pr-2">
            <Button 
              size="icon" 
              variant="ghost" 
              className="hidden sm:flex h-9 w-9 bg-black/40 hover:bg-black/60 rounded-full text-white border border-white/5 opacity-40 hover:opacity-100 transition-opacity"
              onClick={handleNextStory}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            {/* Mobile Tap Target */}
            <div className="sm:hidden absolute inset-0 cursor-pointer" onClick={handleNextStory} />
          </div>

          {/* Caption & Reply Input */}
          <div className="relative z-30 p-4 space-y-4">
            {activeStory.caption && (
              <p className="text-sm font-medium text-white/95 text-center leading-relaxed font-heading drop-shadow-md">
                {activeStory.caption}
              </p>
            )}

            {/* Reply Form */}
            {currentUser?.username !== activeStory.username ? (
              <form onSubmit={handleSendReply} className="flex gap-2 bg-black/30 backdrop-blur-md rounded-xl border border-white/10 p-1">
                <Input 
                  type="text" 
                  placeholder={`Reply to @${activeStory.username}...`} 
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onFocus={() => setIsPlaying(false)}
                  onBlur={() => setIsPlaying(true)}
                  className="bg-transparent border-none focus-visible:ring-0 placeholder:text-white/60 text-xs h-9 text-white"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!replyText.trim()}
                  className="gradient-btn h-9 w-9 rounded-lg border-none flex items-center justify-center shrink-0 shadow-md"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GlobalStoryViewer;
