import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => { throw new Error('SUPABASE WRITE ATTEMPTED IN DEMO'); }),
    rpc: vi.fn(() => { throw new Error('SUPABASE RPC ATTEMPTED IN DEMO'); }),
    storage: { from: vi.fn(() => { throw new Error('STORAGE WRITE ATTEMPTED IN DEMO'); }) },
    auth: { getSession: vi.fn(), onAuthStateChange: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn() },
  },
  // Configured=true makes the test STRONGER: even with live credentials
  // present, demo mode must never reach Supabase.
  isSupabaseConfigured: true,
}));

import { supabase } from '../src/lib/supabase';
import { __setDemoOverride, isDemoMode, resolveAdminAccess, demoStore, clearDemoStorage } from '../src/lib/demo';
import { submitSalesOrder, submitRentalBooking } from '../src/lib/transactions';
import { getWhatsAppAction } from '../src/lib/whatsapp';
import { localeDir, t } from '../src/lib/i18n';

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockedRpc = (supabase as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc;

const orderInput = {
  name: 'Test', phone: '01000000000', fulfillment: 'store_pickup' as const,
  items: [{ dressId: 'demo-1', code: 'AG-W-001', name: 'Gown', priceMinor: 100000, qty: 1 }],
  totalMinor: 100000, currency: 'EGP',
};
const bookingInput = {
  dressId: 'demo-1', dressCode: 'AG-W-001', name: 'Test', phone: '01000000000',
  startDate: '2026-12-01', endDate: '2026-12-04',
  rentalFeeMinor: 900000, bookingDepositMinor: 0, securityDepositMinor: 0, currency: 'EGP',
};

beforeEach(() => { clearDemoStorage(); vi.clearAllMocks(); });
afterEach(() => { __setDemoOverride(null); });

describe('1. demo bookings never invoke real Supabase writes', () => {
  it('routes to the local mock service with a DEMO reference', async () => {
    __setDemoOverride(true);
    expect(isDemoMode()).toBe(true);
    const { reference, demo } = await submitRentalBooking(bookingInput);
    expect(demo).toBe(true);
    expect(reference.startsWith('DEMO-')).toBe(true);
    expect(mockedFrom).not.toHaveBeenCalled();
    expect(mockedRpc).not.toHaveBeenCalled();
    expect(demoStore.listBookings().some((b) => b.reference === reference)).toBe(true);
  });
  it('demo OFF keeps the live path (supabase reachable, prod behavior intact)', async () => {
    __setDemoOverride(false);
    await expect(submitRentalBooking(bookingInput)).rejects.toThrow();
    expect(mockedFrom).toHaveBeenCalled();
  });
});

describe('2. demo checkout never initiates real payment', () => {
  it('stores a local unpaid demo order; no writes, no payment state change', async () => {
    __setDemoOverride(true);
    const { reference, demo } = await submitSalesOrder(orderInput);
    expect(demo).toBe(true);
    expect(reference.startsWith('DEMO-')).toBe(true);
    expect(mockedFrom).not.toHaveBeenCalled();
    const stored = demoStore.listOrders().find((o) => o.reference === reference);
    expect(stored?.payment_status).toBe('unpaid');
    expect(stored?.demoSample).toBe(true);
  });
});

describe('3. demo WhatsApp actions never open/send real messages', () => {
  const payload = { to: '201000000000', productName: 'Gown', productCode: 'AG-W-001', intent: 'rental' as const, lang: 'ar' as const };
  it('demo mode returns a preview action (no wa.me navigation)', () => {
    __setDemoOverride(true);
    const action = getWhatsAppAction(payload);
    expect(action.kind).toBe('preview');
    if (action.kind === 'preview') expect(action.message.join('\n')).toContain('AG-W-001');
  });
  it('production still returns the real wa.me link', () => {
    __setDemoOverride(false);
    const action = getWhatsAppAction(payload);
    expect(action.kind).toBe('link');
    if (action.kind === 'link') expect(action.url.startsWith('https://wa.me/')).toBe(true);
  });
});

describe('4. demo admin changes remain local', () => {
  it('booking status edits hit localStorage only', () => {
    __setDemoOverride(true);
    const before = demoStore.listBookings();
    expect(before.length).toBeGreaterThan(0);
    demoStore.updateBooking(before[0].id, { status: 'confirmed' });
    expect(demoStore.listBookings()[0].status).toBe('confirmed');
    expect(mockedFrom).not.toHaveBeenCalled();
    expect(mockedRpc).not.toHaveBeenCalled();
  });
  it('dress creation stays local and SAMPLE-tagged', () => {
    __setDemoOverride(true);
    const n = demoStore.listDresses().length;
    demoStore.saveDress({ ...(demoStore.listDresses()[0]), id: 'demo-x', code: 'DEMO-X' });
    expect(demoStore.listDresses()).toHaveLength(n + 1);
    expect(mockedFrom).not.toHaveBeenCalled();
  });
});

describe('5. Arabic/English navigation and RTL/LTR intact', () => {
  it('maps ar->rtl and en->ltr', () => {
    expect(localeDir('ar')).toBe('rtl');
    expect(localeDir('en')).toBe('ltr');
  });
  it('demo + nav keys exist in both dictionaries', () => {
    for (const key of ['demo_banner', 'demo_sample', 'demo_order_note', 'demo_booking_note', 'demo_whatsapp_note', 'demo_enter', 'home', 'catalog', 'checkout'] as const) {
      expect(t('ar', key)).not.toBe(key);
      expect(t('en', key)).not.toBe(key);
    }
  });
});

describe('6. production authentication paths preserved', () => {
  it('demo entry is explicit and distinct from auth', () => {
    expect(resolveAdminAccess({ demo: true, offline: false, hasSession: false })).toBe('demo');
  });
  it('offline passthrough behavior unchanged', () => {
    expect(resolveAdminAccess({ demo: false, offline: true, hasSession: false })).toBe('passthrough');
  });
  it('production still gates on session', () => {
    expect(resolveAdminAccess({ demo: false, offline: false, hasSession: true })).toBe('granted');
    expect(resolveAdminAccess({ demo: false, offline: false, hasSession: false })).toBe('denied');
  });
});

describe('7. refresh-safe nested routes on Vercel', () => {
  it('vercel.json falls back all routes to index.html (SPA refresh-safe)', () => {
    const root = path.resolve(__dirname, '..');
    const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    const rules: Array<{ source: string; destination: string }> = vercel.rewrites ?? vercel.routes ?? [];
    expect(rules.some((r) => r.source === '/(.*)' && r.destination === '/index.html')).toBe(true);
  });
  it('build script produces a dist bundle via vite', () => {
    const root = path.resolve(__dirname, '..');
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    expect(pkg.scripts.build).toContain('vite build');
    expect(pkg.scripts.test).toBeTruthy();
  });
});
