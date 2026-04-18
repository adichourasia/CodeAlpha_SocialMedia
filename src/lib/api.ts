const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL = (envBaseUrl && envBaseUrl.length > 0 ? envBaseUrl : '/api').replace(/\/$/, '');
const TOKEN_STORAGE_KEY = 'chatgram.token';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const setStoredToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string | null;
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}) => {
  const { body, headers, token, ...rest } = options;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const requestPath = API_BASE_URL === '/api' && normalizedPath.startsWith('/api')
    ? normalizedPath
    : `${API_BASE_URL}${normalizedPath}`;

  const response = await fetch(requestPath, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.message || 'Request failed';
    throw new ApiError(message, response.status);
  }

  return payload as T;
};

export const protectedRequest = async <T>(path: string, options: RequestOptions = {}) => {
  const token = options.token ?? getStoredToken();
  if (!token) {
    throw new ApiError('Authentication required', 401);
  }

  return apiRequest<T>(path, { ...options, token });
};