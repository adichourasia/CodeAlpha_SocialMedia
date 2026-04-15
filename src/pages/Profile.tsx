import { useParams, Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import PostCard from '@/components/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, Users } from 'lucide-react';

const Profile = () => {
  const { username } = useParams();
  const { users, posts, currentUser, toggleFollow } = useStore();

  const user = users.find(u => u.username === username);
  if (!user) return <div className="p-8 text-center text-muted-foreground">User not found</div>;

  const userPosts = posts.filter(p => p.authorId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const isOwnProfile = currentUser?.id === user.id;
  const isFollowing = currentUser?.following.includes(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="border-b border-border p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar} alt={user.displayName} />
            <AvatarFallback className="text-2xl">{user.displayName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading text-xl font-bold">{user.displayName}</h1>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
              {isOwnProfile ? (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/edit-profile"><Settings className="mr-1.5 h-4 w-4" /> Edit</Link>
                </Button>
              ) : (
                <Button size="sm" variant={isFollowing ? 'outline' : 'default'} onClick={() => toggleFollow(user.id)}>
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </div>
            <p className="mt-2 text-sm">{user.bio}</p>
            <div className="mt-3 flex gap-4 text-sm">
              <Link to={`/profile/${user.username}/followers`} className="hover:underline">
                <span className="font-semibold">{user.followers.length}</span> <span className="text-muted-foreground">followers</span>
              </Link>
              <Link to={`/profile/${user.username}/following`} className="hover:underline">
                <span className="font-semibold">{user.following.length}</span> <span className="text-muted-foreground">following</span>
              </Link>
              <span><span className="font-semibold">{userPosts.length}</span> <span className="text-muted-foreground">posts</span></span>
            </div>
          </div>
        </div>
      </div>

      {userPosts.map(post => <PostCard key={post.id} post={post} />)}
      {userPosts.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">No posts yet</p>
      )}
    </div>
  );
};

export default Profile;
