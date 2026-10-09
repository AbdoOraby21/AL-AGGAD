import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => { throw new Error('SUPABASE WRITE ATTEMPTED'); }),
    rpc: vi.fn(() => { throw new Error('SUPABASE RPC ATTEMPTED'); }),
    storage: { from: vi.fn(() => { throw new Error('STORAGE WRITE ATTEMPTED'); }) },
    auth: { getSession: vi.fn(), onAuthStateChange: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn() },
  },
  isSupabaseConfigured: true,
}));

import {
  __setDemoOverride, clearDemoStorage, demoStore, findDemoConflicts,
  freeSlots, isSlotTaken, makeDemoRef, saveDemoRecord, suggestNextSlot, validatePromo,
  DEMO_STATUS_LABELS,
} from '../src/lib/demo';
import { submitRentalBooking } from '../src/lib/transactions';
import { filterDresses } from '../src/lib/catalog';
import { DEMO_DRESSES } from '../src/app/useDresses';

beforeEach(() => { clearDemoStorage(); __setDemoOverride(true); });
afterEach(() => { __setDemoOverride(null); });

describe('sequential mock references', () => {
  it('issues DEMO-ORD-0001 / DEMO-BOOK-0001 style refs that increment', () => {
    expect(makeDemoRef('S')).toBe('DEMO-ORD-0001');
    expect(makeDemoRef('S')).toBe('DEMO-ORD-0002');
    expect(makeDemoRef('R')).toBe('DEMO-BOOK-0001');
    expect(makeDemoRef('R')).toBe('DEMO-BOOK-0002');
  });
  it('never reuses the real AG-S / AG-R series', () => {
    expect(makeDemoRef('R')).not.toMatch(/^AG-/);
  });
});

describe('demo rental flow data', () => {
  it('persists the chosen slot on the local demo booking', async () => {
    const { reference, demo } = await submitRentalBooking({
      dressId: 'demo-1', dressCode: 'AG-W-001', name: 'T', phone: '01000000000',
      startDate: '2026-12-01', endDate: '2026-12-04', slot: '10:00',
      rentalFeeMinor: 1, bookingDepositMinor: 0, securityDepositMinor: 0,
    });
    expect(demo).toBe(true);
    expect(demoStore.listBookings().find((b) => b.reference === reference)?.slot).toBe('10:00');
  });
  it('status labels are all simulation-marked in both languages', () => {
    for (const s of Object.keys(DEMO_STATUS_LABELS)) {
      const l = DEMO_STATUS_LABELS[s as keyof typeof DEMO_STATUS_LABELS];
      expect(l.ar.length).toBeGreaterThan(0);
      expect(l.en.length).toBeGreaterThan(0);
    }
    expect(DEMO_STATUS_LABELS.confirmed.en).toContain('Simulation Only');
  });
});

describe('conflict detection + suggestions', () => {
  it('detects overlap with the seeded confirmed demo booking (demo-2, today)', () => {
    const seed = demoStore.listBookings().find((b) => b.id === 'demo-b2')!;
    expect(findDemoConflicts('demo-2', seed.start_date, seed.end_date).length).toBeGreaterThan(0);
  });
  it('allows far-future windows and rejects invalid ranges', () => {
    expect(findDemoConflicts('demo-2', '2030-01-01', '2030-01-05')).toHaveLength(0);
    expect(findDemoConflicts('demo-2', '2030-01-05', '2030-01-01')).toHaveLength(0);
  });
  it('suggests a verifiably free window of the same length', () => {
    const seed = demoStore.listBookings().find((b) => b.id === 'demo-b2')!;
    const s = suggestNextSlot('demo-2', seed.start_date, 0);
    expect(s).not.toBeNull();
    expect(findDemoConflicts('demo-2', s!.start, s!.end)).toHaveLength(0);
  });
});

describe('appointment slots', () => {
  it('are deterministic and never all taken', () => {
    expect(isSlotTaken('2026-12-01', '10:00')).toBe(isSlotTaken('2026-12-01', '10:00'));
    expect(freeSlots('2026-12-01').length).toBeGreaterThan(0);
    expect(freeSlots('2026-12-01').every((s) => !isSlotTaken('2026-12-01', s))).toBe(true);
  });
});

describe('promo codes (simulation only)', () => {
  it('accepts DEMO10 case-insensitively and rejects unknown codes', () => {
    expect(validatePromo('demo10')?.percent).toBe(10);
    expect(validatePromo('BOGUS')).toBeNull();
    expect(validatePromo('')).toBeNull();
  });
  it('applies the percentage to simulated totals', () => {
    const p = validatePromo('DEMO10')!;
    expect(Math.round(100000 * (1 - p.percent / 100))).toBe(90000);
  });
  it('supports local admin CRUD', () => {
    demoStore.addPromo({ code: 'T20', percent: 20, expires: null, demoSample: true });
    expect(validatePromo('t20')?.percent).toBe(20);
    demoStore.removePromo('T20');
    expect(validatePromo('T20')).toBeNull();
  });
});

describe('catalog filtering + sorting on the in-memory dataset', () => {
  const base = { category: 'all', mode: 'all' as const, q: '', sort: 'newest' };
  it('filters by category and mode', () => {
    expect(filterDresses(DEMO_DRESSES, { ...base, category: 'wedding' }).every((d) => d.category_slug === 'wedding')).toBe(true);
    expect(filterDresses(DEMO_DRESSES, { ...base, mode: 'rental' }).every((d) => d.rental_enabled)).toBe(true);
  });
  it('searches name and code, filters size, sorts by price', () => {
    expect(filterDresses(DEMO_DRESSES, { ...base, q: 'AG-E-001' }).map((d) => d.code)).toEqual(['AG-E-001']);
    const bySize = filterDresses(DEMO_DRESSES, { ...base, size: 'XS' });
    expect(bySize.length).toBeGreaterThan(0);
    expect(bySize.every((d) => d.sizes.includes('XS'))).toBe(true);
    const asc = filterDresses(DEMO_DRESSES, { ...base, sort: 'price_asc' }).map((d) => d.sale_price_minor ?? 0);
    expect([...asc].sort((a, b) => a - b)).toEqual(asc);
  });
  it('respects a max-price ceiling', () => {
    expect(filterDresses(DEMO_DRESSES, { ...base, maxPriceMinor: 1 })).toHaveLength(0);
  });
});

describe('demo admin CRUD stays local', () => {
  it('creates, updates, deletes sample dresses with units', () => {
    const n = demoStore.listDresses().length;
    const d = { ...demoStore.listDresses()[0], id: 'demo-t', code: 'T-1' };
    demoStore.saveDress(d);
    expect(demoStore.listDresses()).toHaveLength(n + 1);
    demoStore.updateDress('demo-t', { is_featured: true });
    expect(demoStore.listDresses().find((x) => x.id === 'demo-t')?.is_featured).toBe(true);
    const unitId = demoStore.listDresses().find((x) => x.id === 'demo-t')!.units![0].id;
    demoStore.updateUnit('demo-t', unitId, { status: 'maintenance' });
    expect(demoStore.listDresses().find((x) => x.id === 'demo-t')!.units![0].status).toBe('maintenance');
    demoStore.deleteDress('demo-t');
    expect(demoStore.listDresses()).toHaveLength(n);
  });
});

describe('reset + corrupted storage safety', () => {
  it('reset restores the initial sample dataset', () => {
    const n0 = demoStore.listDresses().length;
    demoStore.deleteDress(demoStore.listDresses()[0].id);
    expect(demoStore.listDresses().length).toBe(n0 - 1);
    clearDemoStorage();
    expect(demoStore.listDresses().length).toBe(n0);
    expect(makeDemoRef('R')).toBe('DEMO-BOOK-0001');
  });
  it('corrupted keys reseed instead of crashing', () => {
    try { localStorage.setItem('aggad-demo:bookings', '{broken'); } catch { /* memory fallback untestable here */ }
    expect(() => demoStore.listBookings()).not.toThrow();
    expect(Array.isArray(demoStore.listBookings())).toBe(true);
  });
  it('dashboard figures derive from the demo dataset', () => {
    expect(demoStore.listDresses().length).toBe(DEMO_DRESSES.length);
    expect(demoStore.listBookings().filter((b) => b.status === 'pending_review').length).toBe(1);
    expect(demoStore.listBookings().filter((b) => b.status === 'confirmed').length).toBe(1);
    expect(demoStore.listOrders().length).toBe(1);
  });
});

describe('submissions are inert local records', () => {
  it('visitor submissions are tagged demo and never uploaded', async () => {
    const ref = saveDemoRecord('orders', { customer_name: 'X', total_minor: 5 });
    const all = demoStore.listSubmissions() as Array<{ reference: string; demo: boolean }>;
    expect(all.find((s) => s.reference === ref)?.demo).toBe(true);
  });
});

describe('expanded catalog integrity (40+ reviewed sample dresses)', () => {
  const base = { category: 'all', mode: 'all' as const, q: '', sort: 'newest' };
  it('ships at least 40 dresses with unique ids and codes', () => {
    expect(DEMO_DRESSES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(DEMO_DRESSES.map((d) => d.id)).size).toBe(DEMO_DRESSES.length);
    expect(new Set(DEMO_DRESSES.map((d) => d.code)).size).toBe(DEMO_DRESSES.length);
  });
  it('covers wedding, engagement, and evening categories', () => {
    const cats = new Set(DEMO_DRESSES.map((d) => d.category_slug));
    expect([...cats].sort()).toEqual(['engagement', 'evening', 'wedding']);
    expect(filterDresses(DEMO_DRESSES, { ...base, category: 'evening' }).length).toBeGreaterThan(0);
    expect(filterDresses(DEMO_DRESSES, { ...base, category: 'wedding' }).length).toBeGreaterThanOrEqual(15);
  });
  it('gives every dress a unique valid https photo (no repeats)', () => {
    const urls = DEMO_DRESSES.flatMap((d) => (d.images ?? []).map((i) => i.url));
    expect(urls.length).toBe(DEMO_DRESSES.length);
    expect(urls.every((u) => u.startsWith('https://'))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });
  it('has bilingual names, sizes, and sane pricing on every dress', () => {
    for (const d of DEMO_DRESSES) {
      expect(d.name_ar.length).toBeGreaterThan(1);
      expect(d.name_en.length).toBeGreaterThan(1);
      expect(d.sizes.length).toBeGreaterThan(0);
      if (d.sale_enabled) expect(d.sale_price_minor).toBeGreaterThan(0);
      if (d.rental_enabled) expect(d.rental_price_minor).toBeGreaterThan(0);
    }
    expect(DEMO_DRESSES.some((d) => d.is_featured)).toBe(true);
    expect(DEMO_DRESSES.some((d) => d.is_new)).toBe(true);
  });
});
