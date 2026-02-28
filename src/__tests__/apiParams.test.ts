import { describe, it, expect } from 'vitest';
import type { ArticleQueryParams } from '../types';

// ── buildArticleParams mirrored from services/api.ts ─────────────────────────

function buildArticleParams(params: ArticleQueryParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (params.page    != null) q.page      = String(params.page);
  if (params.limit   != null) q.limit     = String(params.limit);
  if (params.search)          q.search    = params.search;
  if (params.status)          q.status    = params.status;
  if (params.networkId != null) q.networkId = String(params.networkId);
  if (params.featured)        q.featured  = 'true';
  if (params.sortBy)          q.sortBy    = params.sortBy;
  if (params.sortDir)         q.sortDir   = params.sortDir;
  if (params.categoryIds && params.categoryIds.length > 0) {
    q.categoryIds = params.categoryIds.join(',');
  }
  return q;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('buildArticleParams – pagination', () => {
  it('includes page and limit when provided', () => {
    const q = buildArticleParams({ page: 2, limit: 20 });
    expect(q.page).toBe('2');
    expect(q.limit).toBe('20');
  });

  it('coerces numbers to strings', () => {
    const q = buildArticleParams({ page: 1, limit: 100 });
    expect(typeof q.page).toBe('string');
    expect(typeof q.limit).toBe('string');
  });

  it('omits page when not provided', () => {
    const q = buildArticleParams({ limit: 20 });
    expect('page' in q).toBe(false);
  });

  it('omits limit when not provided', () => {
    const q = buildArticleParams({ page: 1 });
    expect('limit' in q).toBe(false);
  });

  it('includes page 0 (falsy but valid)', () => {
    const q = buildArticleParams({ page: 0 });
    expect(q.page).toBe('0');
  });
});

describe('buildArticleParams – search', () => {
  it('includes search when provided', () => {
    const q = buildArticleParams({ search: 'climate' });
    expect(q.search).toBe('climate');
  });

  it('omits search when empty string', () => {
    const q = buildArticleParams({ search: '' });
    expect('search' in q).toBe(false);
  });

  it('omits search when undefined', () => {
    const q = buildArticleParams({});
    expect('search' in q).toBe(false);
  });

  it('preserves spaces and special characters in search', () => {
    const q = buildArticleParams({ search: 'Paris 2024' });
    expect(q.search).toBe('Paris 2024');
  });
});

describe('buildArticleParams – status', () => {
  it('includes status when set to published', () => {
    const q = buildArticleParams({ status: 'published' });
    expect(q.status).toBe('published');
  });

  it('includes status when set to draft', () => {
    expect(buildArticleParams({ status: 'draft' }).status).toBe('draft');
  });

  it('includes status when set to archived', () => {
    expect(buildArticleParams({ status: 'archived' }).status).toBe('archived');
  });

  it('omits status when empty string', () => {
    const q = buildArticleParams({ status: '' });
    expect('status' in q).toBe(false);
  });

  it('omits status when undefined', () => {
    expect('status' in buildArticleParams({})).toBe(false);
  });
});

describe('buildArticleParams – networkId', () => {
  it('includes networkId as string when numeric', () => {
    const q = buildArticleParams({ networkId: 42 });
    expect(q.networkId).toBe('42');
  });

  it('includes networkId when string', () => {
    const q = buildArticleParams({ networkId: '10' });
    expect(q.networkId).toBe('10');
  });

  it('includes networkId 0 (falsy but valid)', () => {
    const q = buildArticleParams({ networkId: 0 });
    expect(q.networkId).toBe('0');
  });

  it('omits networkId when null', () => {
    const q = buildArticleParams({ networkId: null });
    expect('networkId' in q).toBe(false);
  });

  it('omits networkId when undefined', () => {
    expect('networkId' in buildArticleParams({})).toBe(false);
  });
});

describe('buildArticleParams – featured', () => {
  it('includes featured=true when true', () => {
    const q = buildArticleParams({ featured: true });
    expect(q.featured).toBe('true');
  });

  it('omits featured when false', () => {
    const q = buildArticleParams({ featured: false });
    expect('featured' in q).toBe(false);
  });

  it('omits featured when undefined', () => {
    expect('featured' in buildArticleParams({})).toBe(false);
  });
});

describe('buildArticleParams – sorting', () => {
  it('includes sortBy when provided', () => {
    const q = buildArticleParams({ sortBy: 'publishedAt' });
    expect(q.sortBy).toBe('publishedAt');
  });

  it('includes sortDir when provided', () => {
    const q = buildArticleParams({ sortDir: 'desc' });
    expect(q.sortDir).toBe('desc');
  });

  it('includes both sortBy and sortDir together', () => {
    const q = buildArticleParams({ sortBy: 'title', sortDir: 'asc' });
    expect(q.sortBy).toBe('title');
    expect(q.sortDir).toBe('asc');
  });

  it('omits sortBy when undefined', () => {
    expect('sortBy' in buildArticleParams({})).toBe(false);
  });
});

describe('buildArticleParams – categoryIds', () => {
  it('joins single category id as CSV', () => {
    const q = buildArticleParams({ categoryIds: [5] });
    expect(q.categoryIds).toBe('5');
  });

  it('joins multiple category ids with comma', () => {
    const q = buildArticleParams({ categoryIds: [1, 2, 3] });
    expect(q.categoryIds).toBe('1,2,3');
  });

  it('handles string ids', () => {
    const q = buildArticleParams({ categoryIds: ['cat-1', 'cat-2'] });
    expect(q.categoryIds).toBe('cat-1,cat-2');
  });

  it('omits categoryIds when array is empty', () => {
    const q = buildArticleParams({ categoryIds: [] });
    expect('categoryIds' in q).toBe(false);
  });

  it('omits categoryIds when undefined', () => {
    expect('categoryIds' in buildArticleParams({})).toBe(false);
  });
});

describe('buildArticleParams – combined params', () => {
  it('builds a full query object correctly', () => {
    const q = buildArticleParams({
      page:        1,
      limit:       20,
      search:      'tech',
      status:      'published',
      networkId:   10,
      featured:    true,
      sortBy:      'createdAt',
      sortDir:     'desc',
      categoryIds: [1, 2],
    });
    expect(q).toEqual({
      page:        '1',
      limit:       '20',
      search:      'tech',
      status:      'published',
      networkId:   '10',
      featured:    'true',
      sortBy:      'createdAt',
      sortDir:     'desc',
      categoryIds: '1,2',
    });
  });

  it('returns empty object when no params provided', () => {
    expect(buildArticleParams({})).toEqual({});
  });
});
