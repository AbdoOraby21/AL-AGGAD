import type { Dress } from './types';
import type { ModeFilter } from './types';

export interface CatalogQuery {
  category: string; // 'all' | slug
  mode: ModeFilter;
  q: string;
  sort: string; // newest | price_asc | price_desc | featured
  maxPriceMinor?: number | null;
  size?: string;
  color?: string;
  style?: string;
}

/** Pure catalog filtering/sorting over the in-memory dataset (demo or live rows). */
export function filterDresses(dresses: Dress[], query: CatalogQuery): Dress[] {
  let l = dresses.filter((d) => d.is_active && !d.is_sold);
  if (query.category !== 'all') l = l.filter((d) => d.category_slug === query.category);
  if (query.mode === 'sale') l = l.filter((d) => d.sale_enabled);
  if (query.mode === 'rental') l = l.filter((d) => d.rental_enabled);
  const q = query.q.trim().toLowerCase();
  if (q) {
    l = l.filter((d) =>
      d.name_ar.includes(query.q.trim()) ||
      d.name_en.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q),
    );
  }
  if (query.maxPriceMinor != null) {
    l = l.filter((d) => {
      const p = d.sale_price_minor ?? d.rental_price_minor ?? Number.MAX_SAFE_INTEGER;
      return p <= (query.maxPriceMinor as number);
    });
  }
  if (query.size) l = l.filter((d) => d.sizes.includes(query.size as string));
  if (query.color) l = l.filter((d) => d.colors.includes(query.color as string));
  if (query.style) l = l.filter((d) => (d.style ?? '') === query.style);
  const priceOf = (d: Dress) => d.sale_price_minor ?? d.rental_price_minor ?? 0;
  return [...l].sort((a, b) => {
    if (query.sort === 'price_asc') return priceOf(a) - priceOf(b);
    if (query.sort === 'price_desc') return priceOf(b) - priceOf(a);
    if (query.sort === 'featured') return Number(b.is_featured) - Number(a.is_featured);
    return +new Date(b.created_at) - +new Date(a.created_at);
  });
}

export function availableSizes(dresses: Dress[]): string[] {
  return [...new Set(dresses.flatMap((d) => d.sizes))].sort();
}
export function availableColors(dresses: Dress[]): string[] {
  return [...new Set(dresses.flatMap((d) => d.colors))].sort();
}
export function availableStyles(dresses: Dress[]): string[] {
  return [...new Set(dresses.map((d) => d.style).filter((s): s is string => !!s))].sort();
}
export function maxCatalogPrice(dresses: Dress[]): number {
  return dresses.reduce((m, d) => Math.max(m, d.sale_price_minor ?? d.rental_price_minor ?? 0), 0);
}

/** Graceful image fallback (a verified bridal photo) when a URL fails. */
export const FALLBACK_DRESS_IMAGE =
  'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=900&q=80&auto=format&fit=crop';

export function categoryCounts(dresses: Dress[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const d of dresses) {
    if (!d.is_active || d.is_sold) continue;
    counts[d.category_slug] = (counts[d.category_slug] ?? 0) + 1;
  }
  return counts;
}
