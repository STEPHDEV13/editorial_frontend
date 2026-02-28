import { describe, it, expect } from 'vitest';
import type { Article, Category } from '../types';

// ── helpers mirrored from ArticlesPage ───────────────────────────────────────

function buildCategoryMap(categories: Category[]): Map<string, Category> {
  return new Map(categories.map(c => [String(c.id), c]));
}

function filterArticles(
  articles: Article[],
  opts: {
    search?:       string;
    status?:       string;
    categoryIds?:  string[];   // selected category IDs (strings)
    networkId?:    string;
    featuredOnly?: boolean;
  }
): Article[] {
  let list = [...articles];

  if (opts.search) {
    const q = opts.search.toLowerCase();
    list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.content?.toLowerCase().includes(q))
    );
  }
  if (opts.status) {
    list = list.filter(a => a.status === opts.status);
  }
  if (opts.categoryIds && opts.categoryIds.length > 0) {
    const ids = new Set(opts.categoryIds);
    list = list.filter(a => {
      const artIds = a.categoryIds?.map(String) ?? [];
      if (artIds.length > 0) return artIds.some(id => ids.has(id));
      if (a.categoryId != null) return ids.has(String(a.categoryId));
      return false;
    });
  }
  if (opts.networkId) {
    list = list.filter(a => String(a.networkId) === opts.networkId);
  }
  if (opts.featuredOnly) {
    list = list.filter(a => a.featured);
  }

  return list;
}

type SortDir = 'asc' | 'desc';
type SortCol = 'title' | 'createdAt' | 'status' | 'networkId';

function sortArticles(articles: Article[], col: SortCol, dir: SortDir): Article[] {
  return [...articles].sort((a, b) => {
    let av: string, bv: string;
    switch (col) {
      case 'title':     av = a.title;                    bv = b.title; break;
      case 'status':    av = a.status;                   bv = b.status; break;
      case 'networkId': av = String(a.networkId ?? ''); bv = String(b.networkId ?? ''); break;
      default:          av = a.createdAt ?? '';          bv = b.createdAt ?? '';
    }
    return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

// ── fixtures ─────────────────────────────────────────────────────────────────

function makeArticle(overrides: Partial<Article> & { id: number }): Article {
  return {
    title: 'Default', content: 'Default content', status: 'draft', featured: false,
    ...overrides,
  };
}

const articles: Article[] = [
  makeArticle({ id: 1, title: 'Paris climate summit', content: 'Environment and climate change discussions', status: 'published', featured: true,  networkId: 10, categoryIds: [1, 2], createdAt: '2024-01-03' }),
  makeArticle({ id: 2, title: 'Football results',     content: 'Match scores from the weekend',             status: 'published', featured: false, networkId: 20, categoryIds: [2],    createdAt: '2024-01-02' }),
  makeArticle({ id: 3, title: 'Tech innovation',      content: 'New AI breakthroughs announced',            status: 'draft',     featured: true,  networkId: 10, categoryIds: [3],    createdAt: '2024-01-01' }),
  makeArticle({ id: 4, title: 'Archived story',       content: 'Old news',                                  status: 'archived',  featured: false, networkId: 20, categoryId: 1,       createdAt: '2023-12-31' }),
];

// ── search tests ──────────────────────────────────────────────────────────────

describe('filterArticles – search', () => {
  it('matches by title (case-insensitive)', () => {
    const result = filterArticles(articles, { search: 'PARIS' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('matches by content', () => {
    const result = filterArticles(articles, { search: 'AI breakthroughs' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it('returns multiple results for broad search', () => {
    // 'a' appears in title or content of all 4 fixture articles
    const result = filterArticles(articles, { search: 'a' });
    expect(result.length).toBeGreaterThan(1);
  });

  it('returns empty list when nothing matches', () => {
    const result = filterArticles(articles, { search: 'xyzzy_no_match' });
    expect(result).toHaveLength(0);
  });

  it('returns all articles when search is empty', () => {
    expect(filterArticles(articles, { search: '' })).toHaveLength(articles.length);
    expect(filterArticles(articles, {})).toHaveLength(articles.length);
  });
});

// ── status filter tests ───────────────────────────────────────────────────────

describe('filterArticles – status', () => {
  it('filters published articles', () => {
    const result = filterArticles(articles, { status: 'published' });
    expect(result).toHaveLength(2);
    result.forEach(a => expect(a.status).toBe('published'));
  });

  it('filters draft articles', () => {
    const result = filterArticles(articles, { status: 'draft' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it('filters archived articles', () => {
    const result = filterArticles(articles, { status: 'archived' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(4);
  });

  it('returns all articles when status is empty string', () => {
    expect(filterArticles(articles, { status: '' })).toHaveLength(articles.length);
  });
});

// ── category filter tests ─────────────────────────────────────────────────────

describe('filterArticles – categories', () => {
  it('filters by a single category (from categoryIds array)', () => {
    const result = filterArticles(articles, { categoryIds: ['3'] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it('includes articles with that category among multiple', () => {
    // Category 1 is in article 1 (categoryIds) and article 4 (categoryId)
    const result = filterArticles(articles, { categoryIds: ['1'] });
    expect(result.map(a => a.id).sort()).toEqual([1, 4]);
  });

  it('handles legacy categoryId field', () => {
    // Article 4 uses categoryId, not categoryIds
    const result = filterArticles(articles, { categoryIds: ['1'] });
    expect(result.find(a => a.id === 4)).toBeDefined();
  });

  it('filters by multiple categories (union, any match)', () => {
    const result = filterArticles(articles, { categoryIds: ['2', '3'] });
    // Article 1 (cats 1,2), article 2 (cat 2), article 3 (cat 3)
    expect(result.map(a => a.id).sort()).toEqual([1, 2, 3]);
  });

  it('returns empty when no article matches selected category', () => {
    const result = filterArticles(articles, { categoryIds: ['999'] });
    expect(result).toHaveLength(0);
  });

  it('returns all articles when categoryIds is empty', () => {
    expect(filterArticles(articles, { categoryIds: [] })).toHaveLength(articles.length);
  });
});

// ── network filter tests ──────────────────────────────────────────────────────

describe('filterArticles – network', () => {
  it('filters by networkId string', () => {
    const result = filterArticles(articles, { networkId: '10' });
    expect(result).toHaveLength(2);
    result.forEach(a => expect(String(a.networkId)).toBe('10'));
  });

  it('returns empty when no network matches', () => {
    const result = filterArticles(articles, { networkId: '999' });
    expect(result).toHaveLength(0);
  });
});

// ── featured-only filter tests ────────────────────────────────────────────────

describe('filterArticles – featuredOnly', () => {
  it('returns only featured articles', () => {
    const result = filterArticles(articles, { featuredOnly: true });
    expect(result).toHaveLength(2);
    result.forEach(a => expect(a.featured).toBe(true));
  });

  it('returns all when featuredOnly is false', () => {
    expect(filterArticles(articles, { featuredOnly: false })).toHaveLength(articles.length);
  });
});

// ── combined filters ──────────────────────────────────────────────────────────

describe('filterArticles – combined filters', () => {
  it('applies status + category simultaneously', () => {
    const result = filterArticles(articles, { status: 'published', categoryIds: ['2'] });
    // articles 1 and 2 are published AND have cat 2
    expect(result.map(a => a.id).sort()).toEqual([1, 2]);
  });

  it('applies search + network simultaneously', () => {
    const result = filterArticles(articles, { search: 'Tech', networkId: '10' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it('applies status + featured simultaneously', () => {
    const result = filterArticles(articles, { status: 'published', featuredOnly: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});

// ── sorting tests ─────────────────────────────────────────────────────────────

describe('sortArticles', () => {
  it('sorts by title ascending', () => {
    const sorted = sortArticles(articles, 'title', 'asc');
    const titles = sorted.map(a => a.title);
    expect(titles).toEqual([...titles].sort());
  });

  it('sorts by title descending', () => {
    const sorted = sortArticles(articles, 'title', 'desc');
    const titles = sorted.map(a => a.title);
    expect(titles).toEqual([...titles].sort().reverse());
  });

  it('sorts by createdAt descending (most recent first)', () => {
    const sorted = sortArticles(articles, 'createdAt', 'desc');
    expect(sorted[0].createdAt).toBe('2024-01-03');
    expect(sorted[sorted.length - 1].createdAt).toBe('2023-12-31');
  });

  it('sorts by createdAt ascending (oldest first)', () => {
    const sorted = sortArticles(articles, 'createdAt', 'asc');
    expect(sorted[0].createdAt).toBe('2023-12-31');
    expect(sorted[sorted.length - 1].createdAt).toBe('2024-01-03');
  });

  it('sorts by status alphabetically ascending', () => {
    const sorted = sortArticles(articles, 'status', 'asc');
    const statuses = sorted.map(a => a.status);
    expect(statuses).toEqual([...statuses].sort());
  });

  it('does not mutate the original array', () => {
    const original = [...articles];
    sortArticles(articles, 'title', 'desc');
    expect(articles.map(a => a.id)).toEqual(original.map(a => a.id));
  });
});

// ── buildCategoryMap tests ────────────────────────────────────────────────────

describe('buildCategoryMap', () => {
  const cats: Category[] = [
    { id: 1,   name: 'Politique', color: '#FF5722' },
    { id: 'x', name: 'Sport',     color: '#2196F3' },
  ];

  it('indexes by string-coerced id', () => {
    const map = buildCategoryMap(cats);
    expect(map.get('1')?.name).toBe('Politique');
    expect(map.get('x')?.name).toBe('Sport');
  });

  it('returns empty map for empty input', () => {
    expect(buildCategoryMap([])).toEqual(new Map());
  });

  it('last entry wins on duplicate ids', () => {
    const dupes: Category[] = [
      { id: 1, name: 'First' },
      { id: 1, name: 'Second' },
    ];
    const map = buildCategoryMap(dupes);
    expect(map.get('1')?.name).toBe('Second');
  });
});
