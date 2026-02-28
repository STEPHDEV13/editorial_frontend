import { describe, it, expect } from 'vitest';
import type { Article, Category } from '../types';

// ── helpers mirrored from DashboardPage ─────────────────────────────────────

function getArticleCategoryIds(article: Article): Array<number | string> {
  if (article.categoryIds && article.categoryIds.length > 0) return article.categoryIds;
  if (article.categoryId != null) return [article.categoryId];
  return [];
}

interface Stats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  featured: number;
  byNetwork: [string, number][];
  pieData: { name: string; value: number; color: string }[];
}

function computeStats(articles: Article[], categories: Category[]): Stats {
  const total     = articles.length;
  const published = articles.filter(a => a.status === 'published').length;
  const draft     = articles.filter(a => a.status === 'draft').length;
  const archived  = articles.filter(a => a.status === 'archived').length;
  const featured  = articles.filter(a => a.featured).length;

  const networkMap = new Map<string, number>();
  articles.forEach(a => {
    const name = a.network?.name ?? (a.networkId ? `Réseau #${a.networkId}` : null);
    if (name) networkMap.set(name, (networkMap.get(name) ?? 0) + 1);
  });
  const byNetwork = Array.from(networkMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const catCountMap = new Map<string, number>();
  articles.forEach(a => {
    getArticleCategoryIds(a).forEach(cid => {
      const key = String(cid);
      catCountMap.set(key, (catCountMap.get(key) ?? 0) + 1);
    });
  });

  const categoryById = new Map<string, Category>(categories.map(c => [String(c.id), c]));
  const FALLBACK_COLORS = ['#2979FF', '#7B2FBE'];
  const pieData = Array.from(catCountMap.entries())
    .map(([cid, count], i) => {
      const cat = categoryById.get(cid);
      return {
        name:  cat?.name ?? `Catégorie #${cid}`,
        value: count,
        color: cat?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return { total, published, draft, archived, featured, byNetwork, pieData };
}

// ── fixtures ─────────────────────────────────────────────────────────────────

const cats: Category[] = [
  { id: 1, name: 'Politique', color: '#FF5722' },
  { id: 2, name: 'Sport',     color: '#2196F3' },
  { id: 3, name: 'Tech',      color: '#4CAF50' },
];

function makeArticle(overrides: Partial<Article>): Article {
  return {
    id: 1, title: 'Test', content: 'content', status: 'draft', featured: false,
    ...overrides,
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('getArticleCategoryIds', () => {
  it('returns categoryIds array when present and non-empty', () => {
    const a = makeArticle({ categoryIds: [1, 2] });
    expect(getArticleCategoryIds(a)).toEqual([1, 2]);
  });

  it('falls back to categoryId when categoryIds is absent', () => {
    const a = makeArticle({ categoryId: 3 });
    expect(getArticleCategoryIds(a)).toEqual([3]);
  });

  it('prefers categoryIds over categoryId', () => {
    const a = makeArticle({ categoryIds: [1], categoryId: 99 });
    expect(getArticleCategoryIds(a)).toEqual([1]);
  });

  it('returns empty array when categoryIds is empty and no categoryId', () => {
    const a = makeArticle({ categoryIds: [] });
    expect(getArticleCategoryIds(a)).toEqual([]);
  });

  it('falls back to categoryId when categoryIds is empty array', () => {
    const a = makeArticle({ categoryIds: [], categoryId: 2 });
    // empty categoryIds → falls back to categoryId
    expect(getArticleCategoryIds(a)).toEqual([2]);
  });

  it('returns empty when neither field is set', () => {
    const a = makeArticle({});
    expect(getArticleCategoryIds(a)).toEqual([]);
  });
});

describe('computeStats – counts', () => {
  const articles: Article[] = [
    makeArticle({ id: 1, status: 'published', featured: true,  networkId: 10, network: { id: 10, name: 'FR' }, categoryIds: [1] }),
    makeArticle({ id: 2, status: 'published', featured: false, networkId: 10, network: { id: 10, name: 'FR' }, categoryIds: [2] }),
    makeArticle({ id: 3, status: 'draft',     featured: true,  networkId: 20, network: { id: 20, name: 'EN' }, categoryIds: [1] }),
    makeArticle({ id: 4, status: 'archived',  featured: false, networkId: 10, network: { id: 10, name: 'FR' }, categoryIds: [1, 2] }),
  ];

  const stats = computeStats(articles, cats);

  it('counts total articles', () => expect(stats.total).toBe(4));
  it('counts published',      () => expect(stats.published).toBe(2));
  it('counts drafts',         () => expect(stats.draft).toBe(1));
  it('counts archived',       () => expect(stats.archived).toBe(1));
  it('counts featured',       () => expect(stats.featured).toBe(2));
});

describe('computeStats – byNetwork', () => {
  const articles: Article[] = [
    makeArticle({ id: 1, status: 'published', featured: false, networkId: 10, network: { id: 10, name: 'FR' } }),
    makeArticle({ id: 2, status: 'draft',     featured: false, networkId: 10, network: { id: 10, name: 'FR' } }),
    makeArticle({ id: 3, status: 'draft',     featured: false, networkId: 20, network: { id: 20, name: 'EN' } }),
  ];

  const { byNetwork } = computeStats(articles, cats);

  it('aggregates articles per network', () => {
    const map = Object.fromEntries(byNetwork);
    expect(map['FR']).toBe(2);
    expect(map['EN']).toBe(1);
  });

  it('sorts networks descending by count', () => {
    expect(byNetwork[0][0]).toBe('FR');
  });

  it('falls back to "Réseau #id" when network name is missing', () => {
    const a = [makeArticle({ id: 9, status: 'draft', featured: false, networkId: 99 })];
    const { byNetwork: bn } = computeStats(a, cats);
    expect(bn[0][0]).toBe('Réseau #99');
  });

  it('ignores articles with no network info', () => {
    const a = [makeArticle({ id: 9, status: 'draft', featured: false })];
    const { byNetwork: bn } = computeStats(a, cats);
    expect(bn).toHaveLength(0);
  });
});

describe('computeStats – pieData', () => {
  const articles: Article[] = [
    makeArticle({ id: 1, status: 'published', featured: false, categoryIds: [1] }),
    makeArticle({ id: 2, status: 'published', featured: false, categoryIds: [1] }),
    makeArticle({ id: 3, status: 'draft',     featured: false, categoryIds: [2] }),
    // article with TWO categories: counts for both
    makeArticle({ id: 4, status: 'draft',     featured: false, categoryIds: [1, 3] }),
  ];

  const { pieData } = computeStats(articles, cats);

  it('resolves category names from category list', () => {
    const names = pieData.map(d => d.name);
    expect(names).toContain('Politique');
    expect(names).toContain('Sport');
    expect(names).toContain('Tech');
  });

  it('counts each category association (multi-category articles count each)', () => {
    const pol = pieData.find(d => d.name === 'Politique');
    // articles 1, 2, 4 → 3 associations
    expect(pol?.value).toBe(3);
  });

  it('sorts pieData descending by value', () => {
    expect(pieData[0].value).toBeGreaterThanOrEqual(pieData[1].value);
  });

  it('uses category color from category definition', () => {
    const pol = pieData.find(d => d.name === 'Politique');
    expect(pol?.color).toBe('#FF5722');
  });

  it('falls back to brand color for unknown category id', () => {
    const a = [makeArticle({ id: 9, status: 'draft', featured: false, categoryIds: [999] })];
    const { pieData: pd } = computeStats(a, cats);
    const unknown = pd.find(d => d.name === 'Catégorie #999');
    expect(unknown).toBeDefined();
    expect(unknown?.color).toBeTruthy();
  });

  it('returns empty pieData when no articles have categories', () => {
    const a = [makeArticle({ id: 9, status: 'draft', featured: false })];
    const { pieData: pd } = computeStats(a, cats);
    expect(pd).toHaveLength(0);
  });
});
