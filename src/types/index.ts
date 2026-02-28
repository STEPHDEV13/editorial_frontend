// ── Article ────────────────────────────────────────────────────────────────
export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id:           number | string;
  title:        string;
  content:      string;
  summary?:     string;
  slug?:        string;
  status:       ArticleStatus;
  featured:     boolean;
  imageUrl?:    string | null;
  categoryId?:  number | string | null;
  categoryIds?: string[];
  category?:    Category | null;
  networkId?:   number | string | null;
  network?:     Network | null;
  publishedAt?: string | null;
  createdAt?:   string;
  updatedAt?:   string;
}

export interface ArticleFormData {
  title:       string;
  content:     string;
  summary?:    string;
  slug?:       string;
  featured:    boolean;
  imageUrl?:   string;
  categoryId?: string | number | null;
  networkId?:  string | number | null;
}

// ── Category ───────────────────────────────────────────────────────────────
export interface Category {
  id:           number | string;
  name:         string;
  slug?:        string;
  color?:       string;
  description?: string;
  createdAt?:   string;
}

export interface CategoryFormData {
  name:         string;
  color?:       string;
  description?: string;
}

// ── Network ────────────────────────────────────────────────────────────────
export interface Network {
  id:           number | string;
  name:         string;
  slug?:        string;
  description?: string;
}

// ── Notification ───────────────────────────────────────────────────────────
export interface Notification {
  id:        number | string;
  title:     string;
  body:      string;
  html?:     string | null;
  articleId?: number | string | null;
  article?:  Article | null;
  sentAt?:   string | null;
  createdAt?: string;
}

// ── Import ─────────────────────────────────────────────────────────────────
export interface ImportErrorItem {
  index: number;
  error: string;
  item?: unknown;
}

export interface ImportResult {
  success: number;
  total:   number;
  errors:  ImportErrorItem[];
}

// ── Pagination ─────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
}

// ── API error ──────────────────────────────────────────────────────────────
export interface ApiErrorResponse {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}
