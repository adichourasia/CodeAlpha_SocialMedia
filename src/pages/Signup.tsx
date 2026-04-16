import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-primary/10 ring-1 ring-primary/15">
            <img src="/logo.png" alt="ChatGram Logo" className="h-full w-full scale-[1.45] object-contain" />
          </span>
          <h1 className="font-heading text-3xl font-bold text-primary">Join ChatGram</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create your account and start sharing.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'displayName', label: 'Full Name', placeholder: 'John Doe' },
            { key: 'username', label: 'Username', placeholder: 'johndoe' },
            { key: 'email', label: 'Email', placeholder: 'john@example.com', type: 'email' },
            { key: 'password', label: 'Password', placeholder: '••••••••', type: 'password' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-sm font-medium">{f.label}</label>
              <input
                type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => update(f.key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder={f.placeholder}
              />
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
