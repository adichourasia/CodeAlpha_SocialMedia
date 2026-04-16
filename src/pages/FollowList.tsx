import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore, User } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const FollowList = () => {
  const { username, type } = useParams<{ username: string; type: string }>();
  const { currentUser, toggleFollow, loadFollowList } = useStore();
  const navigate = useNavigate();
  const [list, setList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!username || (type !== 'followers' && type !== 'following')) return;

    setIsLoading(true);
    loadFollowList(username, type)
      .then((users) => setList(users))
      .catch((error) => {
        const message = error instanceof Error ? error.message : `Failed to load ${type}`;
        toast.error(message);
      })
      .finally(() => setIsLoading(false));
  }, [username, type, loadFollowList]);

  if (!username || (type !== 'followers' && type !== 'following')) return null;

  const handleToggleFollow = async (targetUsername: string) => {
    try {
      await toggleFollow(targetUsername);
      const refreshed = await loadFollowList(username, type);
      setList(refreshed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update follow state';
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="font-heading text-xl font-bold capitalize">{type}</h1>
      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-center text-sm text-muted-foreground">Loading {type}...</p>}
        {list.map(u => (
          <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            <Link to={`/profile/${u.username}`} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={u.avatarUrl} />
                <AvatarFallback>{u.displayName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading text-sm font-semibold">{u.displayName}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
            </Link>
            {currentUser && currentUser.id !== u.id && (
              <Button size="sm" variant="outline" onClick={() => handleToggleFollow(u.username)}>
                Toggle Follow
              </Button>
            )}
          </div>
        ))}
        {!isLoading && list.length === 0 && <p className="text-center text-sm text-muted-foreground">No {type} yet</p>}
      </div>
    </div>
  );
};

export default FollowList;
