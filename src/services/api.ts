import axios from 'axios';
import type {
  Article,
  ArticleFormData,
  ArticleQueryParams,
  ArticleStatus,
  Category,
  CategoryFormData,
  Network,
  NetworkFormData,
  Notification,
  NotifyPayload,
  ImportResult,
  PaginatedResponse,
} from '../types';

// ── Axios instance ──────────────────────────────────────────────────────────
const BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// Response interceptor – normalize error messages
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      'Une erreur est survenue';
    // Preserve status code for specific handling (e.g. 409)
    const err = new Error(msg) as Error & { status?: number };
    err.status = error?.response?.status;
    return Promise.reject(err);
  }
);

// ── Helper: safely unwrap array responses ───────────────────────────────────
function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    for (const key of ['data', 'items', 'results', 'articles', 'categories', 'notifications', 'networks']) {
      const val = (data as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val as T[];
    }
  }
  console.warn('toArray: unexpected shape, returning []', data);
  return [];
}

// ── Helper: build query string from ArticleQueryParams ──────────────────────
function buildArticleParams(params: ArticleQueryParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (params.page   != null) q.page    = String(params.page);
  if (params.limit  != null) q.limit   = String(params.limit);
  if (params.search)         q.search  = params.search;
  if (params.status)         q.status  = params.status;
  if (params.networkId != null) q.networkId = String(params.networkId);
  if (params.featured)       q.featured = 'true';
  if (params.sortBy)         q.sortBy  = params.sortBy;
  if (params.sortDir)        q.sortDir = params.sortDir;
  if (params.categoryIds && params.categoryIds.length > 0) {
    q.categoryIds = params.categoryIds.join(',');
  }
  return q;
}

// ────────────────────────────────────────────────────────────────────────────
// ARTICLES
// ────────────────────────────────────────────────────────────────────────────

/** GET /api/articles – with optional query params, returns paginated or array */
export const getArticles = async (params?: ArticleQueryParams): Promise<Article[]> => {
  const q = params ? buildArticleParams(params) : undefined;
  const { data } = await api.get('/api/articles', { params: q });
  return toArray<Article>(data);
};

/** GET /api/articles – paginated variant */
export const getArticlesPaginated = async (
  params: ArticleQueryParams
): Promise<PaginatedResponse<Article>> => {
  const q = buildArticleParams(params);
  const { data } = await api.get('/api/articles', { params: q });
  // Handle both paginated and plain array responses
  if (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data) {
    return data as PaginatedResponse<Article>;
  }
  const items = toArray<Article>(data);
  return { data: items, total: items.length, page: params.page ?? 1, limit: params.limit ?? 20 };
};

/** GET /api/articles/:id */
export const getArticle = async (id: number | string): Promise<Article> => {
  const { data } = await api.get(`/api/articles/${id}`);
  return data;
};

/** POST /api/articles */
export const createArticle = async (payload: ArticleFormData): Promise<Article> => {
  const { data } = await api.post('/api/articles', payload);
  return data;
};

/** PUT /api/articles/:id */
export const updateArticle = async (
  id: number | string,
  payload: Partial<ArticleFormData>
): Promise<Article> => {
  const { data } = await api.put(`/api/articles/${id}`, payload);
  return data;
};

/** DELETE /api/articles/:id */
export const deleteArticle = async (id: number | string): Promise<void> => {
  await api.delete(`/api/articles/${id}`);
};

/** PATCH /api/articles/:id/status */
export const patchArticleStatus = async (
  id: number | string,
  status: ArticleStatus
): Promise<Article> => {
  const { data } = await api.patch(`/api/articles/${id}/status`, { status });
  return data;
};

/** POST /api/articles/:id/notify */
export const notifyArticle = async (
  id: number | string,
  payload?: NotifyPayload
): Promise<{ html?: string; message?: string }> => {
  const { data } = await api.post(`/api/articles/${id}/notify`, payload ?? {});
  return data;
};

// ────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ────────────────────────────────────────────────────────────────────────────

/** GET /api/categories */
export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get('/api/categories');
  return toArray<Category>(data);
};

/** POST /api/categories */
export const createCategory = async (payload: CategoryFormData): Promise<Category> => {
  const { data } = await api.post('/api/categories', payload);
  return data;
};

/** PUT /api/categories/:id */
export const updateCategory = async (
  id: number | string,
  payload: Partial<CategoryFormData>
): Promise<Category> => {
  const { data } = await api.put(`/api/categories/${id}`, payload);
  return data;
};

/** DELETE /api/categories/:id */
export const deleteCategory = async (id: number | string): Promise<void> => {
  await api.delete(`/api/categories/${id}`);
};

// ────────────────────────────────────────────────────────────────────────────
// NETWORKS
// ────────────────────────────────────────────────────────────────────────────

/** GET /api/networks */
export const getNetworks = async (): Promise<Network[]> => {
  const { data } = await api.get('/api/networks');
  return toArray<Network>(data);
};

/** POST /api/networks */
export const createNetwork = async (payload: NetworkFormData): Promise<Network> => {
  const { data } = await api.post('/api/networks', payload);
  return data;
};

/** PUT /api/networks/:id */
export const updateNetwork = async (
  id: number | string,
  payload: Partial<NetworkFormData>
): Promise<Network> => {
  const { data } = await api.put(`/api/networks/${id}`, payload);
  return data;
};

/** DELETE /api/networks/:id */
export const deleteNetwork = async (id: number | string): Promise<void> => {
  await api.delete(`/api/networks/${id}`);
};

// ────────────────────────────────────────────────────────────────────────────
// IMPORT
// ────────────────────────────────────────────────────────────────────────────

/** POST /api/import/articles – send file in multipart body */
export const importArticles = async (file: File): Promise<ImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/api/import/articles', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────────────────────────────────────────

/** GET /api/notifications */
export const getNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get('/api/notifications');
  return toArray<Notification>(data);
};
