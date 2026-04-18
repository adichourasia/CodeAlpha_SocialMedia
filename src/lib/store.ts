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

export const useStore = create<AppStore>((set, get) => ({

    // Search users by name (username or displayName)
    searchUsers: async (query: string) => {
      if (!query.trim()) return [];
      const response = await apiRequest<{ users: UserType[] }>(`/api/users?search=${encodeURIComponent(query)}`, { method: 'GET' });
      return response.users;
    },
  token: getStoredToken(),
  currentUser: null,
  posts: [],
  isAuthenticated: false,
  isBootstrapping: true,
  isLoadingPosts: false,
  error: null,

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
    } catch {
      clearStoredToken();
      set({ token: null, currentUser: null, isAuthenticated: false, isBootstrapping: false });
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
