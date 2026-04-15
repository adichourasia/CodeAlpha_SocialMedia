import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const FollowList = () => {
  const { username, type } = useParams<{ username: string; type: string }>();
  const { users, currentUser, toggleFollow } = useStore();
  const navigate = useNavigate();

  const user = users.find(u => u.username === username);
  if (!user) return null;

  const list = type === 'followers'
    ? users.filter(u => user.followers.includes(u.id))
    : users.filter(u => user.following.includes(u.id));

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="font-heading text-xl font-bold capitalize">{type}</h1>
      <div className="mt-4 space-y-3">
        {list.map(u => (
          <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            <Link to={`/profile/${u.username}`} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={u.avatar} />
                <AvatarFallback>{u.displayName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading text-sm font-semibold">{u.displayName}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
            </Link>
            {currentUser && currentUser.id !== u.id && (
              <Button size="sm" variant={currentUser.following.includes(u.id) ? 'outline' : 'default'}
                onClick={() => toggleFollow(u.id)}>
                {currentUser.following.includes(u.id) ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="text-center text-sm text-muted-foreground">No {type} yet</p>}
      </div>
    </div>
  );
};

export default FollowList;
