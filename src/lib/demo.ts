/**
 * Demo mode core. When VITE_DEMO_MODE=true the app runs a safe,
 * database-independent demo: no Supabase writes, no payments, no real
 * WhatsApp sends. All demo interactions stay in browser localStorage and
 * are explicitly tagged as demo records, so a refresh can never promote
 * them into real transactions (production code paths never read these keys).
 *
 * This module NEVER imports Supabase. Demo admin edits and submissions
 * go through `demoStore` / `submitDemo*` only.
 */
import type { Dress } from './types';
import { DEMO_DRESSES } from '../app/useDresses';

/** Explicit env flag (Vite convention). Missing flag => safe fallback OFF. */
let override: boolean | null = null;
export function isDemoMode(): boolean {
  if (override !== null) return override;
  try {
    return import.meta.env.VITE_DEMO_MODE === 'true';
  } catch {
    return false;
  }
}
/** Test-only escape hatch. App code must never call this. */
export function __setDemoOverride(v: boolean | null): void {
  override = v;
}

/** Explicit demo entry vs production auth. Demo access is NOT auth. */
export function resolveAdminAccess(opts: { demo: boolean; offline: boolean; hasSession: boolean }): 'demo' | 'passthrough' | 'granted' | 'denied' {
  if (opts.demo) return 'demo';
  if (opts.offline) return 'passthrough'; // pre-existing offline preview behavior, unchanged
  return opts.hasSession ? 'granted' : 'denied';
}

/** Clearly fake references — never collide with real AG-S / AG-R series. */
export function makeDemoRef(kind: 'S' | 'R'): string {
  return `DEMO-AG-${kind}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/* ---------- tiny safe storage (localStorage with in-memory fallback) ---------- */
const mem = new Map<string, string>();
function sGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return mem.get(key) ?? null;
  }
}
function sSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    mem.set(key, value);
  }
}
function readKey<T>(key: string, seed: () => T): T {
  const raw = sGet(key);
  if (raw) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      /* corrupted => reseed */
    }
  }
  const v = seed();
  sSet(key, JSON.stringify(v));
  return v;
}
function writeKey(key: string, value: unknown): void {
  sSet(key, JSON.stringify(value));
}
export function clearDemoStorage(): void {
  for (const k of Object.keys(demoSeeds)) {
    const full = `aggad-demo:${k}`;
    try {
      localStorage.removeItem(full);
    } catch {
      mem.delete(full);
    }
  }
}

/* ----------fixtures: obviously fictional persons, SAMPLE-tagged ---------- */
export interface DemoBooking {
  id: string;
  reference: string;
  dress_id: string;
  dress_code: string;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  rental_fee_minor: number;
  currency: string;
  status: string;
  payment_status: string;
  demoSample: true;
  created_at: string;
}
export interface DemoOrder {
  id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  fulfillment_method: string;
  total_minor: number;
  currency: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  items: Array<{ dress_code: string; name_snapshot: string; unit_price_minor: number; quantity: number }>;
  demoSample: true;
  created_at: string;
}
export interface DemoCustomer {
  id: string;
  full_name: string;
  phone: string;
  demoSample: true;
}
export interface DemoDress extends Dress {
  demoSample: true;
}

const today = new Date().toISOString().slice(0, 10);

const demoSeeds: Record<string, () => unknown> = {
  dresses: (): DemoDress[] =>
    DEMO_DRESSES.map((d) => ({ ...d, demoSample: true as const })),
  bookings: (): DemoBooking[] => [
    {
      id: 'demo-b1', reference: 'DEMO-AG-R-1001', dress_id: 'demo-1', dress_code: 'AG-W-001',
      customer_name: 'Demo Bride — عروسة تجريبية', customer_phone: '+20 100 000 0001',
      start_date: today, end_date: today, rental_fee_minor: 900000, currency: 'EGP',
      status: 'pending_review', payment_status: 'unpaid', demoSample: true, created_at: new Date().toISOString(),
    },
    {
      id: 'demo-b2', reference: 'DEMO-AG-R-1002', dress_id: 'demo-2', dress_code: 'AG-E-001',
      customer_name: 'Sample Client — عميلة تجريبية', customer_phone: '+20 100 000 0002',
      start_date: today, end_date: today, rental_fee_minor: 550000, currency: 'EGP',
      status: 'confirmed', payment_status: 'partial', demoSample: true, created_at: new Date().toISOString(),
    },
  ],
  orders: (): DemoOrder[] => [
    {
      id: 'demo-o1', reference: 'DEMO-AG-S-1001',
      customer_name: 'Demo Bride — عروسة تجريبية', customer_phone: '+20 100 000 0001',
      fulfillment_method: 'store_pickup', total_minor: 4500000, currency: 'EGP',
      status: 'pending', payment_status: 'unpaid', fulfillment_status: 'pending',
      items: [{ dress_code: 'AG-W-001', name_snapshot: 'Royal Lace Wedding Gown', unit_price_minor: 4500000, quantity: 1 }],
      demoSample: true, created_at: new Date().toISOString(),
    },
  ],
  customers: (): DemoCustomer[] => [
    { id: 'demo-c1', full_name: 'Demo Bride — عروسة تجريبية', phone: '+20 100 000 0001', demoSample: true },
    { id: 'demo-c2', full_name: 'Sample Client — عميلة تجريبية', phone: '+20 100 000 0002', demoSample: true },
  ],
  settings: () => ({
    boutique_name_ar: 'العقاد (تجريبي)', boutique_name_en: 'AL AGGAD (DEMO)',
    whatsapp_number: '201000000000', currency: 'EGP',
  }),
  submissions: (): unknown[] => [],
};

/** Local-only store. Every record it returns/accepts is a demo record. */
export const demoStore = {
  listDresses(): DemoDress[] {
    return readKey<DemoDress[]>('aggad-demo:dresses', demoSeeds.dresses as () => DemoDress[]);
  },
  saveDress(d: DemoDress): void {
    const list = demoStore.listDresses();
    writeKey('aggad-demo:dresses', [...list, d]);
  },
  updateDress(id: string, patch: Partial<DemoDress>): void {
    writeKey('aggad-demo:dresses', demoStore.listDresses().map((d) => (d.id === id ? { ...d, ...patch } : d)));
  },
  listBookings(): DemoBooking[] {
    return readKey<DemoBooking[]>('aggad-demo:bookings', demoSeeds.bookings as () => DemoBooking[]);
  },
  addBooking(b: DemoBooking): void {
    writeKey('aggad-demo:bookings', [b, ...demoStore.listBookings()]);
  },
  updateBooking(id: string, patch: Partial<DemoBooking>): void {
    writeKey('aggad-demo:bookings', demoStore.listBookings().map((b) => (b.id === id ? { ...b, ...patch } : b)));
  },
  listOrders(): DemoOrder[] {
    return readKey<DemoOrder[]>('aggad-demo:orders', demoSeeds.orders as () => DemoOrder[]);
  },
  addOrder(o: DemoOrder): void {
    writeKey('aggad-demo:orders', [o, ...demoStore.listOrders()]);
  },
  updateOrder(id: string, patch: Partial<DemoOrder>): void {
    writeKey('aggad-demo:orders', demoStore.listOrders().map((o) => (o.id === id ? { ...o, ...patch } : o)));
  },
  listCustomers(): DemoCustomer[] {
    return readKey<DemoCustomer[]>('aggad-demo:customers', demoSeeds.customers as () => DemoCustomer[]);
  },
  getSettings(): Record<string, string> {
    return readKey<Record<string, string>>('aggad-demo:settings', demoSeeds.settings as () => Record<string, string>);
  },
  saveSettings(s: Record<string, string>): void {
    writeKey('aggad-demo:settings', s);
  },
  listSubmissions(): unknown[] {
    return readKey<unknown[]>('aggad-demo:submissions', demoSeeds.submissions as () => unknown[]);
  },
};

/** Persist a visitor demo submission locally, tagged demo:true. */
export function saveDemoRecord(collection: 'orders' | 'bookings', record: Record<string, unknown>): string {
  const reference = makeDemoRef(collection === 'orders' ? 'S' : 'R');
  const entry = { ...record, reference, demo: true, savedAt: new Date().toISOString() };
  const key = 'aggad-demo:submissions';
  const list = readKey<unknown[]>(key, demoSeeds.submissions as () => unknown[]);
  writeKey(key, [entry, ...list]);
  if (collection === 'orders') {
    demoStore.addOrder({
      id: `demo-${reference}`, reference,
      customer_name: String(record.customer_name ?? ''), customer_phone: String(record.customer_phone ?? ''),
      fulfillment_method: String(record.fulfillment_method ?? 'store_pickup'),
      total_minor: Number(record.total_minor ?? 0), currency: String(record.currency ?? 'EGP'),
      status: 'pending', payment_status: 'unpaid', fulfillment_status: 'pending',
      items: (record.items as DemoOrder['items']) ?? [],
      demoSample: true, created_at: new Date().toISOString(),
    });
  } else {
    demoStore.addBooking({
      id: `demo-${reference}`, reference,
      dress_id: String(record.dress_id ?? ''), dress_code: String(record.dress_code ?? ''),
      customer_name: String(record.customer_name ?? ''), customer_phone: String(record.customer_phone ?? ''),
      start_date: String(record.start_date ?? today), end_date: String(record.end_date ?? today),
      rental_fee_minor: Number(record.rental_fee_minor ?? 0), currency: String(record.currency ?? 'EGP'),
      status: 'pending_review', payment_status: 'unpaid',
      demoSample: true, created_at: new Date().toISOString(),
    });
  }
  return reference;
}
