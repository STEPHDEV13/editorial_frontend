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
  categoryIds?: Array<number | string>;
  category?:    Category | null;
  categories?:  Category[];
  networkId?:   number | string | null;
  network?:     Network | null;
  publishedAt?: string | null;
  createdAt?:   string;
  updatedAt?:   string;
}

export interface ArticleFormData {
  title:        string;
  content:      string;
  summary?:     string;
  slug?:        string;
  featured:     boolean;
  imageUrl?:    string;
  categoryIds?: Array<number | string>;
  networkId?:   string | number | null;
}

export interface ArticleQueryParams {
  page?:        number;
  limit?:       number;
  search?:      string;
  status?:      ArticleStatus | '';
  categoryIds?: Array<number | string>;
  networkId?:   number | string | null;
  featured?:    boolean;
  sortBy?:      string;
  sortDir?:     'asc' | 'desc';
}

// ── Category ───────────────────────────────────────────────────────────────
export interface Category {
  id:           number | string;
  name:         string;
  slug?:        string;
  color?:       string;
  description?: string;
  articleCount?: number;
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
  articleCount?: number;
}

export interface NetworkFormData {
  name:         string;
  slug?:        string;
  description?: string;
}

// ── Notification ───────────────────────────────────────────────────────────
export interface Notification {
  id:           number | string;
  title?:       string;
  body?:        string;
  html?:        string | null;
  articleId?:   number | string | null;
  article?:     Article | null;
  recipients?:  string[];
  recipientCount?: number;
  subject?:     string;
  sentAt?:      string | null;
  status?:      'sent' | 'failed' | 'pending';
  createdAt?:   string;
}

export interface NotifyPayload {
  recipients: string[];
  subject?:   string;
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
