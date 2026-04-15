import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio: string;
  avatar: string;
  followers: string[];
  following: string[];
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  image?: string;
  likes: string[];
  comments: Comment[];
  createdAt: Date;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

const DEMO_USERS: User[] = [
  {
    id: '1', username: 'alexchen', displayName: 'Alex Chen', email: 'alex@example.com',
    bio: 'Designer & maker. Building cool things on the internet ✨',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    followers: ['2', '3', '4'], following: ['2', '3'],
  },
  {
    id: '2', username: 'saradesign', displayName: 'Sara Kim', email: 'sara@example.com',
    bio: 'UI/UX designer at heart 🎨 Coffee addict ☕',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    followers: ['1', '3'], following: ['1', '4'],
  },
  {
    id: '3', username: 'marcusdev', displayName: 'Marcus Johnson', email: 'marcus@example.com',
    bio: 'Full-stack developer 🚀 Open source enthusiast',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    followers: ['1'], following: ['1', '2'],
  },
  {
    id: '4', username: 'emmawrite', displayName: 'Emma Davis', email: 'emma@example.com',
    bio: 'Writer & storyteller 📝 Exploring the world one word at a time',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    followers: ['2'], following: [],
  },
];

const DEMO_POSTS: Post[] = [
  {
    id: 'p1', authorId: '1', content: 'Just launched my new portfolio site! Feeling proud of how it turned out. What do you all think? 🚀',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    likes: ['2', '3'], comments: [
      { id: 'c1', authorId: '2', content: 'Looks amazing! Love the color palette 🎨', createdAt: new Date('2025-04-14T10:30:00') },
    ],
    createdAt: new Date('2025-04-14T09:00:00'),
  },
  {
    id: 'p2', authorId: '2', content: 'Morning coffee and wireframes — the perfect combo. ☕✏️ Working on something exciting that I can\'t wait to share!',
    likes: ['1', '3', '4'], comments: [],
    createdAt: new Date('2025-04-13T08:15:00'),
  },
  {
    id: 'p3', authorId: '3', content: 'Just open-sourced my new React hooks library! Check it out and let me know your thoughts. Contributions welcome! 🛠️',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop',
    likes: ['1'], comments: [
      { id: 'c2', authorId: '1', content: 'This is awesome Marcus! Starred it already ⭐', createdAt: new Date('2025-04-12T15:00:00') },
      { id: 'c3', authorId: '4', content: 'Great work! Will definitely try it out.', createdAt: new Date('2025-04-12T16:30:00') },
    ],
    createdAt: new Date('2025-04-12T14:00:00'),
  },
  {
    id: 'p4', authorId: '4', content: 'Sometimes the best ideas come when you stop trying so hard. Taking a break by the lake today. 🌊',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    likes: ['2'], comments: [],
    createdAt: new Date('2025-04-11T11:00:00'),
  },
];

interface AppStore {
  currentUser: User | null;
  users: User[];
  posts: Post[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  signup: (username: string, displayName: string, email: string, password: string) => boolean;
  logout: () => void;
  createPost: (content: string, image?: string) => void;
  deletePost: (postId: string) => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  toggleFollow: (userId: string) => void;
  updateProfile: (data: Partial<Pick<User, 'displayName' | 'bio' | 'avatar'>>) => void;
  getUserById: (id: string) => User | undefined;
}

export const useStore = create<AppStore>((set, get) => ({
  currentUser: DEMO_USERS[0],
  users: DEMO_USERS,
  posts: DEMO_POSTS,
  isAuthenticated: true,

  login: (username: string, _password: string) => {
    const user = get().users.find(u => u.username === username);
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  signup: (username, displayName, email, _password) => {
    const exists = get().users.find(u => u.username === username || u.email === email);
    if (exists) return false;
    const newUser: User = {
      id: Date.now().toString(), username, displayName, email, bio: '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E8622A&color=fff&size=150`,
      followers: [], following: [],
    };
    set(s => ({ users: [...s.users, newUser], currentUser: newUser, isAuthenticated: true }));
    return true;
  },

  logout: () => set({ currentUser: null, isAuthenticated: false }),

  createPost: (content, image) => {
    const user = get().currentUser;
    if (!user) return;
    const post: Post = {
      id: Date.now().toString(), authorId: user.id, content, image,
      likes: [], comments: [], createdAt: new Date(),
    };
    set(s => ({ posts: [post, ...s.posts] }));
  },

  deletePost: (postId) => set(s => ({ posts: s.posts.filter(p => p.id !== postId) })),

  toggleLike: (postId) => {
    const user = get().currentUser;
    if (!user) return;
    set(s => ({
      posts: s.posts.map(p =>
        p.id === postId
          ? { ...p, likes: p.likes.includes(user.id) ? p.likes.filter(id => id !== user.id) : [...p.likes, user.id] }
          : p
      ),
    }));
  },

  addComment: (postId, content) => {
    const user = get().currentUser;
    if (!user) return;
    const comment: Comment = { id: Date.now().toString(), authorId: user.id, content, createdAt: new Date() };
    set(s => ({
      posts: s.posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p),
    }));
  },

  deleteComment: (postId, commentId) =>
    set(s => ({
      posts: s.posts.map(p =>
        p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p
      ),
    })),

  toggleFollow: (userId) => {
    const user = get().currentUser;
    if (!user || user.id === userId) return;
    set(s => {
      const isFollowing = user.following.includes(userId);
      return {
        currentUser: { ...user, following: isFollowing ? user.following.filter(id => id !== userId) : [...user.following, userId] },
        users: s.users.map(u => {
          if (u.id === user.id) return { ...u, following: isFollowing ? u.following.filter(id => id !== userId) : [...u.following, userId] };
          if (u.id === userId) return { ...u, followers: isFollowing ? u.followers.filter(id => id !== user.id) : [...u.followers, user.id] };
          return u;
        }),
      };
    });
  },

  updateProfile: (data) => {
    const user = get().currentUser;
    if (!user) return;
    const updated = { ...user, ...data };
    set(s => ({
      currentUser: updated,
      users: s.users.map(u => u.id === user.id ? updated : u),
    }));
  },

  getUserById: (id) => get().users.find(u => u.id === id),
}));
