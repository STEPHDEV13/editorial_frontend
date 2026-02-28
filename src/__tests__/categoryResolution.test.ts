import { describe, it, expect } from 'vitest';
import type { Category } from '../types';

// ── helpers mirrored from ArticlesPage ──────────────────────────────────────

function buildCategoryMap(categories: Category[]): Record<string, Category> {
  return Object.fromEntries(categories.map((c) => [String(c.id), c]));
}

function resolveCategory(
  article: { categoryIds?: string[]; categoryId?: string | number | null },
  map: Record<string, Category>
): Category | null {
  const firstId =
    article.categoryIds?.[0] ??
    (article.categoryId ? String(article.categoryId) : undefined);
  return firstId ? (map[firstId] ?? null) : null;
}

// ── fixtures ─────────────────────────────────────────────────────────────────

const categories: Category[] = [
  { id: 'cat-1', name: 'Politique', color: '#FF5722' },
  { id: 'cat-2', name: 'Sport',     color: '#2196F3' },
];

// ── tests ────────────────────────────────────────────────────────────────────

describe('buildCategoryMap', () => {
  it('indexes categories by string id', () => {
    const map = buildCategoryMap(categories);
    expect(map['cat-1']).toEqual(categories[0]);
    expect(map['cat-2']).toEqual(categories[1]);
  });

  it('returns empty map when categories list is empty', () => {
    expect(buildCategoryMap([])).toEqual({});
  });
});

describe('resolveCategory', () => {
  const map = buildCategoryMap(categories);

  it('resolves from categoryIds array (backend format)', () => {
    const cat = resolveCategory({ categoryIds: ['cat-1'] }, map);
    expect(cat?.name).toBe('Politique');
  });

  it('resolves from categoryId string (legacy format)', () => {
    const cat = resolveCategory({ categoryId: 'cat-2' }, map);
    expect(cat?.name).toBe('Sport');
  });

  it('prefers categoryIds over categoryId when both present', () => {
    const cat = resolveCategory({ categoryIds: ['cat-1'], categoryId: 'cat-2' }, map);
    expect(cat?.name).toBe('Politique');
  });

  it('returns null when article has no category', () => {
    const cat = resolveCategory({}, map);
    expect(cat).toBeNull();
  });

  it('returns null when categoryId not found in map', () => {
    const cat = resolveCategory({ categoryIds: ['cat-99'] }, map);
    expect(cat).toBeNull();
  });

  it('returns null when categoryIds is empty array', () => {
    const cat = resolveCategory({ categoryIds: [] }, map);
    expect(cat).toBeNull();
  });
});
