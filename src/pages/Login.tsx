import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter username/email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, cubicBezier: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm space-y-7 glass-card p-6 sm:p-8 rounded-2xl shadow-xl border border-white/10 relative z-10"
      >
        <div className="text-center">
          <motion.span 
            whileHover={{ scale: 1.08, rotate: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-primary/10 ring-1 ring-primary/15 shadow-md"
          >
            <img src="/logo.png" alt="ChatGram Logo" className="h-full w-full scale-[1.45] object-contain" />
          </motion.span>
          <h1 className="font-heading text-3xl font-bold gradient-text">ChatGram</h1>
          <p className="mt-2 text-sm text-muted-foreground/80 font-medium">Welcome back! Sign in to continue.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">Username or Email</label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input/60 bg-background/50 px-3.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50"
              placeholder="alexchen or alex@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">Password</label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-input/60 bg-background/50 px-3.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all pr-10 placeholder:text-muted-foreground/50"
                placeholder="Your password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/85 hover:text-primary transition-colors"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
            <Button type="submit" className="w-full gradient-btn border-none rounded-xl font-bold text-sm shadow-md" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </motion.div>
        </form>

        {/* Quick Demo Accounts */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <p className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Quick Demo Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Aditya Demo', username: 'aditya_demo' },
              { label: 'Maya Demo', username: 'maya_demo' }
            ].map(account => (
              <button
                key={account.username}
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  setUsername(account.username);
                  setPassword('demo1234');
                  setIsSubmitting(true);
                  try {
                    await login(account.username, 'demo1234');
                    toast.success(`Logged in as ${account.label}!`);
                    navigate('/');
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'Login failed';
                    toast.error(message);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="flex flex-col items-center justify-center py-2 px-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center group"
              >
                <span className="text-xs font-bold text-foreground/95 group-hover:text-primary transition-colors">{account.label}</span>
                <span className="text-[9px] text-muted-foreground">@{account.username}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground/80">
          Don't have an account? <Link to="/signup" className="font-bold text-primary hover:text-primary-hover hover:underline transition-colors">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
