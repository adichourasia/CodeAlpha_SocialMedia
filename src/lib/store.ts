  // ...existing code...

import { create } from 'zustand';
import type { User as UserType } from './store';
import {
  ApiError,
  apiRequest,
  clearStoredToken,
  getStoredToken,
  protectedRequest,
  setStoredToken,
} from '@/lib/api';
import { getRandomFeedImageUrl } from '@/lib/post-image';


export type User = {
  id: number;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  createdAt: string;
};

export interface PostAuthor {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export interface PostComment {
  id: number;
  content: string;
  createdAt: string;
  author: PostAuthor;
}

export interface Post {
  id: number;
  content: string;
  imageUrl: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  author: PostAuthor;
  comments: PostComment[];
}

export interface ProfileStats {
  postCount: number;
  followerCount: number;
  followingCount: number;
}

export interface ProfileData {
  user: User;
  stats: ProfileStats;
  isFollowing: boolean;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  reset?: boolean;
}

export interface Story {
  username: string;
  displayName: string;
  avatarUrl: string;
  mediaUrl: string;
  caption: string;
  viewed: boolean;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
}

export interface Chat {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  online: boolean;
  messages: ChatMessage[];
}

interface AppStore {
  token: string | null;
  currentUser: UserType | null;
  posts: Post[];
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isLoadingPosts: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  signup: (username: string, displayName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadPosts: (options?: PaginationOptions) => Promise<{ posts: Post[]; hasMore: boolean }>;
  loadPost: (postId: number) => Promise<Post>;
  createPost: (content: string, imageUrl?: string) => Promise<void>;
  toggleLike: (postId: number) => Promise<void>;
  loadComments: (postId: number) => Promise<void>;
  addComment: (postId: number, content: string) => Promise<void>;
  deletePost: (postId: number) => Promise<void>;
  deleteComment: (postId: number, commentId: number) => Promise<void>;
  toggleFollow: (username: string) => Promise<boolean>;
  loadProfile: (username: string) => Promise<ProfileData>;
  loadProfilePosts: (username: string, options?: PaginationOptions) => Promise<{ posts: Post[]; hasMore: boolean }>;
  loadFollowList: (username: string, type: 'followers' | 'following') => Promise<UserType[]>;
  updateProfile: (data: Partial<Pick<UserType, 'displayName' | 'bio' | 'avatarUrl'>>) => Promise<UserType>;
  getPostById: (id: number) => Post | undefined;
  clearError: () => void;
  searchUsers: (query: string) => Promise<UserType[]>;
  generateCaptions: (prompt: string, tone: string) => Promise<string[]>;

  // Stories state & actions
  stories: Story[];
  activeStoryUser: string | null;
  setActiveStoryUser: (username: string | null) => void;
  markStoryAsViewed: (username: string) => void;
  addStory: (mediaUrl: string, caption: string) => void;

  // Chat/DM state & actions
  chats: Chat[];
  activeChatId: number | null;
  setActiveChatId: (id: number | null) => void;
  sendMessage: (chatId: number, text: string) => void;
  sendStoryReply: (username: string, replyText: string) => void;
}

const normalizePost = (post: Omit<Post, 'comments'> & { comments?: PostComment[] }): Post => ({
  ...post,
  imageUrl: getRandomFeedImageUrl(post.id, post.imageUrl),
  comments: post.comments || [],
});

const getApiErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong';
};

const buildQueryPath = (path: string, options: PaginationOptions = {}) => {
  const params = new URLSearchParams();
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.offset !== undefined) params.set('offset', String(options.offset));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
};

const updatePostInState = (state: AppStore, postId: number, updater: (post: Post) => Post) =>
  state.posts.map((post) => (post.id === postId ? updater(post) : post));

const DEFAULT_STORIES: Story[] = [
  {
    username: 'johndoe',
    displayName: 'John Doe',
    avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=8b5cf6&color=fff',
    mediaUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
    caption: 'Fueling up for the weekend coding session! ☕️💻',
    viewed: false
  },
  {
    username: 'sarah_k',
    displayName: 'Sarah King',
    avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+King&background=3b82f6&color=fff',
    mediaUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80',
    caption: 'Colors of today 🎨🖌️',
    viewed: false
  },
  {
    username: 'emma_b',
    displayName: 'Emma Brown',
    avatarUrl: 'https://ui-avatars.com/api/?name=Emma+Brown&background=f97316&color=fff',
    mediaUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80',
    caption: "Someone doesn't want me to work today 🐾❤️",
    viewed: false
  },
  {
    username: 'tech_wizard',
    displayName: 'Tech Wizard',
    avatarUrl: 'https://ui-avatars.com/api/?name=Tech+Wizard&background=10b981&color=fff',
    mediaUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
    caption: 'Upgrading the mainframe 🚀🔌',
    viewed: false
  },
  {
    username: 'photo_nomad',
    displayName: 'Photo Nomad',
    avatarUrl: 'https://ui-avatars.com/api/?name=Photo+Nomad&background=3b82f6&color=fff',
    mediaUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80',
    caption: 'Chasing horizons 🌅🌵',
    viewed: false
  },
  {
    username: 'baker_delight',
    displayName: 'Baker Delight',
    avatarUrl: 'https://ui-avatars.com/api/?name=Baker+Delight&background=f59e0b&color=fff',
    mediaUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    caption: 'Fresh sourdough out of the oven! 🥖🔥',
    viewed: false
  }
];

const DEFAULT_CHATS: Chat[] = [
  {
    id: 1,
    username: 'johndoe',
    displayName: 'John Doe',
    avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=8b5cf6&color=fff',
    online: true,
    messages: [
      { id: 1, senderId: 2, text: "Hey! Did you check out the new layout updates on ChatGram?", timestamp: "10:15 AM" },
      { id: 2, senderId: 1, text: "Yes, it looks amazing! I love the glassmorphism elements.", timestamp: "10:16 AM" },
      { id: 3, senderId: 2, text: "Awesome! The double tap to like is so addictive now.", timestamp: "10:17 AM" },
    ]
  },
  {
    id: 2,
    username: 'sarah_k',
    displayName: 'Sarah King',
    avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+King&background=3b82f6&color=fff',
    online: false,
    messages: [
      { id: 1, senderId: 2, text: "Let me know when you get offline, we need to coordinate the feed content.", timestamp: "Yesterday" }
    ]
  },
  {
    id: 3,
    username: 'emma_b',
    displayName: 'Emma Brown',
    avatarUrl: 'https://ui-avatars.com/api/?name=Emma+Brown&background=f97316&color=fff',
    online: true,
    messages: [
      { id: 1, senderId: 2, text: "The parallax backgrounds are so smooth!", timestamp: "2h ago" },
      { id: 2, senderId: 1, text: "Absolutely, they add so much depth to scrolling.", timestamp: "2h ago" }
    ]
  }
];

export const useStore = create<AppStore>((set, get) => ({

    // Search users by name (username or displayName)
    searchUsers: async (query: string) => {
      if (!query.trim()) return [];
      const response = await apiRequest<{ users: UserType[] }>(`/api/users?search=${encodeURIComponent(query)}`, { method: 'GET' });
      return response.users;
    },
    generateCaptions: async (prompt: string, tone: string) => {
      const { token } = get();
      const response = await protectedRequest<{ captions: string[] }>('/api/ai/generate-captions', {
        method: 'POST',
        token,
        body: { prompt, tone },
      });
      return response.captions;
    },
  token: getStoredToken(),
  currentUser: null,
  posts: [],
  isAuthenticated: false,
  isBootstrapping: true,
  isLoadingPosts: false,
  error: null,

  // Stories
  stories: DEFAULT_STORIES,
  activeStoryUser: null,
  setActiveStoryUser: (username) => set({ activeStoryUser: username }),
  markStoryAsViewed: (username) => set((state) => ({
    stories: state.stories.map(s => s.username === username ? { ...s, viewed: true } : s)
  })),
  addStory: (mediaUrl, caption) => set((state) => {
    if (!state.currentUser) return {};
    const newStory: Story = {
      username: state.currentUser.username,
      displayName: state.currentUser.displayName,
      avatarUrl: state.currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${state.currentUser.username}`,
      mediaUrl,
      caption,
      viewed: false
    };
    const filtered = state.stories.filter(s => s.username !== state.currentUser?.username);
    return {
      stories: [newStory, ...filtered]
    };
  }),

  // Chat/DMs
  chats: DEFAULT_CHATS,
  activeChatId: 1,
  setActiveChatId: (id) => set({ activeChatId: id }),
  sendMessage: (chatId, text) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      senderId: currentUser.id,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      )
    }));

    // Trigger mock auto-reply bot
    setTimeout(() => {
      const currentChat = get().chats.find((c) => c.id === chatId);
      if (!currentChat) return;

      const getBotReply = (userText: string) => {
        const cleanText = userText.toLowerCase().trim();
        if (cleanText.includes('hello') || cleanText.includes('hey') || cleanText.includes('hi')) {
          return "Hey there! How is your day going on ChatGram?";
        }
        if (cleanText.includes('?') || cleanText.includes('why') || cleanText.includes('how')) {
          return "That is a very good question! I'm still figuring that out myself.";
        }
        if (cleanText.includes('cool') || cleanText.includes('awesome') || cleanText.includes('nice')) {
          return "Totally! The coding team really nailed this release.";
        }
        const replies = [
          "I saw your latest post, that photo was amazing!",
          "Indeed! Let's catch up later today.",
          "Haha, that's true.",
          "Absolutely agree with you on that.",
          "I'm actually testing out the light and dark theme mode, it's so satisfying."
        ];
        return replies[Math.floor(Math.random() * replies.length)];
      };

      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        senderId: chatId,
        text: getBotReply(text),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, botMessage] }
            : c
        )
      }));
    }, 1500);
  },

  sendStoryReply: (username, replyText) => {
    const { currentUser, chats } = get();
    if (!currentUser) return;

    const existingChat = chats.find(c => c.username === username);
    const chatId = existingChat ? existingChat.id : Date.now();

    const userMessage: ChatMessage = {
      id: Date.now(),
      senderId: currentUser.id,
      text: `Replied to your story: "${replyText}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (!existingChat) {
      const mockAvatars: Record<string, string> = {
        johndoe: 'https://ui-avatars.com/api/?name=John+Doe&background=8b5cf6&color=fff',
        sarah_k: 'https://ui-avatars.com/api/?name=Sarah+King&background=3b82f6&color=fff',
        emma_b: 'https://ui-avatars.com/api/?name=Emma+Brown&background=f97316&color=fff',
        tech_wizard: 'https://ui-avatars.com/api/?name=Tech+Wizard&background=10b981&color=fff',
        photo_nomad: 'https://ui-avatars.com/api/?name=Photo+Nomad&background=3b82f6&color=fff',
        baker_delight: 'https://ui-avatars.com/api/?name=Baker+Delight&background=f59e0b&color=fff',
      };

      const newChat: Chat = {
        id: chatId,
        username,
        displayName: username.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        avatarUrl: mockAvatars[username] || `https://ui-avatars.com/api/?name=${username}`,
        online: true,
        messages: [userMessage]
      };

      set((state) => ({
        chats: [...state.chats, newChat]
      }));
    } else {
      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, userMessage] }
            : c
        )
      }));
    }

    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        senderId: chatId,
        text: `Thanks for replying to my story! glad you liked it! 😊✨`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, botMessage] }
            : c
        )
      }));
    }, 1500);
  },

  initializeAuth: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ token: null, currentUser: null, isAuthenticated: false, isBootstrapping: false });
      return;
    }

    try {
      const response = await protectedRequest<{ user: User }>('/api/me', { token });
      set({
        token,
        currentUser: response.user,
        isAuthenticated: true,
        isBootstrapping: false,
        error: null,
      });
    } catch (error: unknown) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        clearStoredToken();
        set({ token: null, currentUser: null, isAuthenticated: false, isBootstrapping: false });
      } else {
        // Safe bootstrapping resolution: stop loading, do not clear token for network timeouts.
        set({ isBootstrapping: false });
      }
    }
  },

  login: async (usernameOrEmail, password) => {
    const payload = usernameOrEmail.includes('@')
      ? { email: usernameOrEmail, password }
      : { username: usernameOrEmail, password };

    const response = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: payload,
    });

    setStoredToken(response.token);
    set({ token: response.token, currentUser: response.user, isAuthenticated: true, error: null });
  },

  signup: async (username, displayName, email, password) => {
    const response = await apiRequest<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: { username, displayName, email, password },
    });

    setStoredToken(response.token);
    set({ token: response.token, currentUser: response.user, isAuthenticated: true, error: null });
  },

  logout: () => {
    clearStoredToken();
    set({ token: null, currentUser: null, posts: [], isAuthenticated: false, error: null });
  },

  loadPosts: async (options = {}) => {
    const { limit = 10, offset = 0, reset = offset === 0 } = options;
    set({ isLoadingPosts: reset });

    try {
      const { token } = get();
      const path = buildQueryPath('/api/posts', { limit, offset });
      const response = token
        ? await protectedRequest<{ posts: Post[]; hasMore: boolean }>(path, { method: 'GET', token })
        : await apiRequest<{ posts: Post[]; hasMore: boolean }>(path, { method: 'GET' });

      const nextPosts = response.posts.map(normalizePost);
      set((state) => ({
        posts: reset ? nextPosts : [...state.posts, ...nextPosts],
        isLoadingPosts: false,
        error: null,
      }));

      return { posts: nextPosts, hasMore: response.hasMore ?? nextPosts.length === limit };
    } catch (error) {
      set({ isLoadingPosts: false, error: getApiErrorMessage(error) });
      throw error;
    }
  },

  loadPost: async (postId) => {
    const { token } = get();
    const response = token
      ? await protectedRequest<{ post: Post }>(`/api/posts/${postId}`, { method: 'GET', token })
      : await apiRequest<{ post: Post }>(`/api/posts/${postId}`, { method: 'GET' });

    const loadedPost = normalizePost(response.post);
    set((state) => {
      const existingIndex = state.posts.findIndex((post) => post.id === postId);
      if (existingIndex === -1) {
        return { posts: [...state.posts, loadedPost], error: null };
      }

      const nextPosts = [...state.posts];
      nextPosts[existingIndex] = loadedPost;
      return { posts: nextPosts, error: null };
    });

    return loadedPost;
  },

  createPost: async (content, imageUrl) => {
    const { token } = get();
    const normalizedImageUrl = imageUrl?.trim() || '';
    const response = await protectedRequest<{ post: Post }>('/api/posts', {
      method: 'POST',
      token,
      body: { content, imageUrl: normalizedImageUrl },
    });

    const createdPost = normalizePost(response.post);
    set((state) => ({ posts: [createdPost, ...state.posts], error: null }));
  },

  toggleLike: async (postId) => {
    const { token } = get();
    const previousPost = get().posts.find((post) => post.id === postId);
    if (!previousPost) {
      throw new ApiError('Post not found', 404);
    }

    const optimisticLiked = !previousPost.likedByMe;
    const optimisticCount = Math.max(0, previousPost.likeCount + (optimisticLiked ? 1 : -1));
    set((state) => ({
      posts: updatePostInState(state, postId, (post) => ({
        ...post,
        likedByMe: optimisticLiked,
        likeCount: optimisticCount,
      })),
    }));

    try {
      const response = await protectedRequest<{ liked: boolean; likeCount: number }>(`/api/posts/${postId}/like`, {
        method: 'POST',
        token,
      });

      set((state) => ({
        posts: updatePostInState(state, postId, (post) => ({
          ...post,
          likedByMe: response.liked,
          likeCount: response.likeCount,
        })),
        error: null,
      }));
    } catch (error) {
      set((state) => ({
        posts: updatePostInState(state, postId, () => previousPost),
      }));
      throw error;
    }
  },

  loadComments: async (postId) => {
    const response = await apiRequest<{ comments: PostComment[] }>(`/api/posts/${postId}/comments`, {
      method: 'GET',
    });

    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: response.comments,
              commentCount: response.comments.length,
            }
          : post
      ),
      error: null,
    }));
  },

  addComment: async (postId, content) => {
    const { token, currentUser } = get();
    if (!currentUser) {
      throw new ApiError('Authentication required', 401);
    }

    const tempId = Date.now();
    const optimisticComment: PostComment = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
      },
    };

    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, optimisticComment],
              commentCount: post.commentCount + 1,
            }
          : post
      ),
    }));

    try {
      const response = await protectedRequest<{ comment: PostComment }>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        token,
        body: { content },
      });

      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) => (comment.id === tempId ? response.comment : comment)),
              }
            : post
        ),
        error: null,
      }));
    } catch (error) {
      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.filter((comment) => comment.id !== tempId),
                commentCount: Math.max(0, post.commentCount - 1),
              }
            : post
        ),
      }));
      throw error;
    }
  },

  deletePost: async (postId) => {
    const { token } = get();
    const previousPosts = get().posts;
    set((state) => ({ posts: state.posts.filter((post) => post.id !== postId) }));

    try {
      await protectedRequest<{ deleted: boolean }>(`/api/posts/${postId}`, {
        method: 'DELETE',
        token,
      });
      set({ error: null });
    } catch (error) {
      set({ posts: previousPosts });
      throw error;
    }
  },

  deleteComment: async (postId, commentId) => {
    const { token } = get();
    const previousPosts = get().posts;

    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.filter((comment) => comment.id !== commentId),
              commentCount: Math.max(0, post.commentCount - 1),
            }
          : post
      ),
    }));

    try {
      await protectedRequest<{ deleted: boolean }>(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        token,
      });
      set({ error: null });
    } catch (error) {
      set({ posts: previousPosts });
      throw error;
    }
  },

  toggleFollow: async (username) => {
    const { token } = get();
    const response = await protectedRequest<{ following: boolean }>(`/api/profiles/${username}/follow`, {
      method: 'POST',
      token,
    });

    return response.following;
  },

  loadProfile: async (username) => {
    const { token } = get();
    const response = token
      ? await protectedRequest<ProfileData>(`/api/profiles/${username}`, { method: 'GET', token })
      : await apiRequest<ProfileData>(`/api/profiles/${username}`, { method: 'GET' });

    return response;
  },

  loadProfilePosts: async (username, options = {}) => {
    const { limit = 6, offset = 0 } = options;
    const { token } = get();
    const path = buildQueryPath(`/api/profiles/${username}/posts`, { limit, offset });
    const response = token
      ? await protectedRequest<{ posts: Post[]; hasMore: boolean }>(path, { method: 'GET', token })
      : await apiRequest<{ posts: Post[]; hasMore: boolean }>(path, { method: 'GET' });

    const posts = response.posts.map(normalizePost);
    return { posts, hasMore: response.hasMore ?? posts.length === limit };
  },

  loadFollowList: async (username, type) => {
    const { token } = get();
    const response = token
      ? await protectedRequest<{ users: User[] }>(`/api/profiles/${username}/${type}`, { method: 'GET', token })
      : await apiRequest<{ users: User[] }>(`/api/profiles/${username}/${type}`, { method: 'GET' });

    return response.users;
  },

  updateProfile: async (data) => {
    const { token } = get();
    const response = await protectedRequest<{ user: User }>('/api/profiles/me', {
      method: 'PATCH',
      token,
      body: data,
    });

    set({ currentUser: response.user, error: null });
    return response.user;
  },

  getPostById: (id) => get().posts.find((post) => post.id === id),

  clearError: () => set({ error: null }),
}));
