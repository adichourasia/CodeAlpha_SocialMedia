import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Signup = () => {
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.displayName.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('All fields are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(form.username.trim(), form.displayName.trim(), form.email.trim(), form.password);
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

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
            whileHover={{ scale: 1.08, rotate: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-primary/10 ring-1 ring-primary/15 shadow-md"
          >
            <img src="/logo.png" alt="ChatGram Logo" className="h-full w-full scale-[1.45] object-contain" />
          </motion.span>
          <h1 className="font-heading text-3xl font-bold gradient-text">Join ChatGram</h1>
          <p className="mt-2 text-sm text-muted-foreground/80 font-medium">Create your account and start sharing.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'displayName', label: 'Full Name', placeholder: 'John Doe' },
            { key: 'username', label: 'Username', placeholder: 'johndoe' },
            { key: 'email', label: 'Email', placeholder: 'john@example.com', type: 'email' },
            { key: 'password', label: 'Password', placeholder: '••••••••', type: 'password' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">{f.label}</label>
              <input
                type={f.type || 'text'} value={form[f.key as keyof typeof form]} onChange={e => update(f.key, e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input/60 bg-background/50 px-3.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50"
                placeholder={f.placeholder}
              />
            </div>
          ))}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
            <Button type="submit" className="w-full gradient-btn border-none rounded-xl font-bold text-sm shadow-md" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </motion.div>
        </form>
        <p className="text-center text-sm text-muted-foreground/80">
          Already have an account? <Link to="/login" className="font-bold text-primary hover:text-primary-hover hover:underline transition-colors">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
