import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const EditProfile = () => {
  const { currentUser, updateProfile } = useStore();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');

  if (!currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ displayName, bio, avatar });
    toast.success('Profile updated!');
    navigate(`/profile/${currentUser.username}`);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="font-heading text-2xl font-bold">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatar} />
            <AvatarFallback>{displayName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <label className="text-sm font-medium">Avatar URL</label>
            <input value={avatar} onChange={e => setAvatar(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Display Name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="text-sm font-medium">Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <Button type="submit" className="w-full">Save Changes</Button>
      </form>
    </div>
  );
};

export default EditProfile;
