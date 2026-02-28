// ── Enums / Literals ──────────────────────────────────────────────────────────

import { ReactNode } from "react";

export type ArticleStatus = 'draft' | 'published' | 'archived';

// ── Category ──────────────────────────────────────────────────────────────────

export interface Category {
  id:          number;
  name:        string;
  slug?:       string;
  color?:      string;       // hex ou CSS color, ex: '#E53935'
  description?: string;
  createdAt?:  string;
  updatedAt?:  string;
}

export interface CategoryFormData {
  name:         string;
  slug?:        string;
  color?:       string;
  description?: string;
}

// ── Network ───────────────────────────────────────────────────────────────────

export interface Network {
  id:          number;
  name:        string;
  slug?:       string;
  description?: string;
  logoUrl?:    string;
  createdAt?:  string;
  updatedAt?:  string;
}

export interface NetworkFormData {
  name:         string;
  slug?:        string;
  description?: string;
  logoUrl?:     string;
}

// ── Article ───────────────────────────────────────────────────────────────────

export interface Article {
  id:           number;
  title:        string;
  slug?:        string;
  content:      string;
  excerpt:      string;
  authorName:   string;
  summary?:     string;
  imageUrl?:    string;
  featured:     boolean;
  status:       ArticleStatus;

  // Relations
  networkId?:   number;
  network?:     Network;

  /** Support mono-catégorie (legacy) et multi-catégories */
  categoryId?:  number;
  category?:    Category;
  categoryIds?: number[];
  categories?:  Category[];

  // Dates
  publishedAt?: string;       // ISO 8601
  createdAt?:   string;
  updatedAt?:   string;
}

export interface ArticleFormData {
  title:        string;
  content:      string;
  excerpt:      string;
  authorName:   string;
  summary?:     string;
  slug?:        string;
  imageUrl?:    string;
  featured:     boolean;
  categoryIds:  number[];
  networkId:    string | number | null;
}

// ── Query params ──────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc';
export type SortBy  = 'createdAt' | 'updatedAt' | 'publishedAt' | 'title';

export interface ArticleQueryParams {
  page?:        number;
  limit?:       number;
  search?:      string;
  status?:      ArticleStatus;
  networkId?:   number;
  featured?:    boolean;
  sortBy?:      SortBy;
  sortDir?:     SortDir;
  categoryIds?: number[];
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data:   T[];
  total:  number;
  page:   number;
  limit:  number;
}

// ── Notification ──────────────────────────────────────────────────────────────

export interface Notification {
  recipientCount: any;
  recipients: any;
  html: any;
  subject: any;
  status: any;
  id:        number;
  title?:    string;
  message?:  string;
  articleId?: number;
  article?:  Article;
  sentAt?:   string;
  createdAt?: string;
}

export interface NotifyPayload {
  channels?:  string[];       // ex: ['email', 'push']
  message?:   string;
  subject?:   string;
  recipients?: string[];
}

// ── Import ────────────────────────────────────────────────────────────────────

export interface ImportResult {
  total: number;
  success: any;
  imported:  number;
  skipped:   number;
  errors:    ImportError[];
}

export interface ImportError {
  index: number;
  error: ReactNode;
  row?:    number;
  field?:  string;
  message: string;
}