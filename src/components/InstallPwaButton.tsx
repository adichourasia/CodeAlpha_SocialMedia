import { useState, useEffect } from 'react';
import { usePwaInstall } from '@/lib/pwa';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPwaButton = () => {
  const { triggerInstall, canInstall } = usePwaInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('chatgram.pwa.dismissed') === 'true';
    
    if (canInstall && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [canInstall]);

  const handleInstall = async () => {
    setIsVisible(false);
    const result = await triggerInstall();
    if (result.outcome === 'accepted') {
      localStorage.setItem('chatgram.pwa.dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('chatgram.pwa.dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 md:bottom-6 md:right-6 md:left-auto md:p-0">
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className="w-full max-w-sm glass-card border border-primary/20 p-5 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-xl bg-card/85"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            
            <button
              onClick={handleDismiss}
              className="absolute right-3.5 top-3.5 text-muted-foreground/80 hover:text-foreground hover:bg-muted/50 p-1.5 rounded-full transition-colors"
              aria-label="Dismiss prompt"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/15 shadow-inner">
                <Smartphone className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-sm font-bold gradient-text">Install ChatGram App</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Install our app on your home screen for a fast, full-screen experience and push notifications!
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1 rounded-xl text-xs font-semibold h-9"
              >
                Later
              </Button>
              <Button
                onClick={handleInstall}
                className="flex-1 rounded-xl text-xs font-bold h-9 gradient-btn border-none text-white shadow-md flex items-center justify-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Install Now
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InstallPwaButton;
