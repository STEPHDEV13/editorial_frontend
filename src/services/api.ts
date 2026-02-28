import axios from 'axios';
import type {
  Article,
  ArticleFormData,
  ArticleStatus,
  Category,
  CategoryFormData,
  Network,
  Notification,
  ImportResult,
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
    return Promise.reject(new Error(msg));
  }
);

// ── Helper: safely unwrap array responses ───────────────────────────────────
function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    // try common envelope keys
    for (const key of ['data', 'items', 'results', 'articles', 'categories', 'notifications', 'networks']) {
      const val = (data as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val as T[];
    }
  }
  console.warn('toArray: unexpected shape, returning []', data);
  return [];
}

// ────────────────────────────────────────────────────────────────────────────
// ARTICLES
// ────────────────────────────────────────────────────────────────────────────

/** GET /api/articles */
export const getArticles = async (): Promise<Article[]> => {
  const { data } = await api.get('/api/articles');
  return toArray<Article>(data);
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
  id: number | string
): Promise<{ html?: string; message?: string }> => {
  const { data } = await api.post(`/api/articles/${id}/notify`);
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