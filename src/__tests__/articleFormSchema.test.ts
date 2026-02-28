import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ── Schema mirrored from ArticleFormPage ─────────────────────────────────────

const schema = z.object({
  title:       z.string().min(5, 'Titre minimum 5 caractères').max(255),
  content:     z.string().min(50, 'Contenu minimum 50 caractères'),
  summary:     z.string().max(500).optional().or(z.literal('')),
  slug:        z.string().max(255).optional().or(z.literal('')),
  imageUrl:    z.string().url('URL invalide').optional().or(z.literal('')),
  featured:    z.boolean(),
  categoryIds: z.array(z.any()).min(1, 'Au moins une catégorie requise'),
  networkId:   z.union([z.string(), z.number()]).nullable().refine(
    v => v !== null && v !== '',
    { message: 'Réseau obligatoire' }
  ),
});

// Valid baseline payload
const valid = {
  title:       'Mon article de test',
  content:     'Ceci est un contenu suffisamment long pour passer la validation minimum de cinquante caractères.',
  summary:     'Un résumé.',
  slug:        'mon-article-de-test',
  imageUrl:    'https://example.com/image.jpg',
  featured:    false,
  categoryIds: [{ id: 1, name: 'Tech' }],
  networkId:   '10',
};

function parse(overrides: object) {
  return schema.safeParse({ ...valid, ...overrides });
}

// ── title ─────────────────────────────────────────────────────────────────────

describe('schema – title', () => {
  it('accepts a valid title (≥5 chars)', () => {
    expect(parse({ title: 'Hello world' }).success).toBe(true);
  });

  it('rejects title shorter than 5 characters', () => {
    const r = parse({ title: 'Hi' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = r.error.issues[0].message;
      expect(msg).toContain('5');
    }
  });

  it('rejects empty title', () => {
    expect(parse({ title: '' }).success).toBe(false);
  });

  it('rejects title of exactly 4 characters', () => {
    expect(parse({ title: 'abcd' }).success).toBe(false);
  });

  it('accepts title of exactly 5 characters', () => {
    expect(parse({ title: 'abcde' }).success).toBe(true);
  });

  it('rejects title longer than 255 characters', () => {
    expect(parse({ title: 'a'.repeat(256) }).success).toBe(false);
  });

  it('accepts title of exactly 255 characters', () => {
    expect(parse({ title: 'a'.repeat(255) }).success).toBe(true);
  });
});

// ── content ───────────────────────────────────────────────────────────────────

describe('schema – content', () => {
  it('accepts content ≥50 characters', () => {
    expect(parse({ content: 'a'.repeat(50) }).success).toBe(true);
  });

  it('rejects content shorter than 50 characters', () => {
    const r = parse({ content: 'Too short' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toContain('50');
    }
  });

  it('rejects content of exactly 49 characters', () => {
    expect(parse({ content: 'a'.repeat(49) }).success).toBe(false);
  });

  it('accepts content of exactly 50 characters', () => {
    expect(parse({ content: 'a'.repeat(50) }).success).toBe(true);
  });
});

// ── summary ───────────────────────────────────────────────────────────────────

describe('schema – summary', () => {
  it('accepts empty string summary', () => {
    expect(parse({ summary: '' }).success).toBe(true);
  });

  it('accepts undefined summary', () => {
    const { summary: _, ...rest } = valid;
    expect(schema.safeParse(rest).success).toBe(true);
  });

  it('accepts valid summary', () => {
    expect(parse({ summary: 'Un résumé court.' }).success).toBe(true);
  });

  it('rejects summary longer than 500 characters', () => {
    expect(parse({ summary: 'a'.repeat(501) }).success).toBe(false);
  });

  it('accepts summary of exactly 500 characters', () => {
    expect(parse({ summary: 'a'.repeat(500) }).success).toBe(true);
  });
});

// ── imageUrl ──────────────────────────────────────────────────────────────────

describe('schema – imageUrl', () => {
  it('accepts a valid https URL', () => {
    expect(parse({ imageUrl: 'https://cdn.example.com/photo.jpg' }).success).toBe(true);
  });

  it('accepts a valid http URL', () => {
    expect(parse({ imageUrl: 'http://example.com/img.png' }).success).toBe(true);
  });

  it('accepts empty string (no image)', () => {
    expect(parse({ imageUrl: '' }).success).toBe(true);
  });

  it('accepts undefined imageUrl', () => {
    const { imageUrl: _, ...rest } = valid;
    expect(schema.safeParse(rest).success).toBe(true);
  });

  it('rejects a non-URL string', () => {
    const r = parse({ imageUrl: 'not-a-url' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toContain('URL');
    }
  });

  it('rejects a relative path', () => {
    expect(parse({ imageUrl: '/images/photo.jpg' }).success).toBe(false);
  });
});

// ── categoryIds ───────────────────────────────────────────────────────────────

describe('schema – categoryIds', () => {
  it('accepts an array with one category', () => {
    expect(parse({ categoryIds: [{ id: 1, name: 'Tech' }] }).success).toBe(true);
  });

  it('accepts an array with multiple categories', () => {
    expect(parse({
      categoryIds: [{ id: 1, name: 'Tech' }, { id: 2, name: 'Sport' }],
    }).success).toBe(true);
  });

  it('rejects an empty array', () => {
    const r = parse({ categoryIds: [] });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toContain('catégorie');
    }
  });
});

// ── networkId ─────────────────────────────────────────────────────────────────

describe('schema – networkId', () => {
  it('accepts a string network id', () => {
    expect(parse({ networkId: '42' }).success).toBe(true);
  });

  it('accepts a numeric network id', () => {
    expect(parse({ networkId: 42 }).success).toBe(true);
  });

  it('rejects null', () => {
    const r = parse({ networkId: null });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toContain('Réseau');
    }
  });

  it('rejects empty string', () => {
    expect(parse({ networkId: '' }).success).toBe(false);
  });
});

// ── full valid payload ────────────────────────────────────────────────────────

describe('schema – full valid payload', () => {
  it('parses a complete valid payload without errors', () => {
    const r = schema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('exposes correct parsed values', () => {
    const r = schema.safeParse(valid);
    if (!r.success) throw new Error(JSON.stringify(r.error));
    expect(r.data.title).toBe(valid.title);
    expect(r.data.featured).toBe(false);
    expect(r.data.categoryIds).toHaveLength(1);
  });
});
