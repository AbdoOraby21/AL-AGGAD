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
import type { BookingStatus, Dress, DressUnit } from './types';
import { DEMO_DRESSES } from '../app/useDresses';
import { rangesOverlap } from './availability';

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

/** Sequential, clearly mock references: DEMO-ORD-0001 / DEMO-BOOK-0001. */
function nextSeq(key: string): number {
  const full = `aggad-demo:${key}`;
  const raw = sGet(full);
  const n = raw ? parseInt(raw, 10) + 1 : 1;
  sSet(full, String(n));
  return n;
}
export function makeDemoRef(kind: 'S' | 'R'): string {
  const n = nextSeq(kind === 'S' ? 'seq-orders' : 'seq-bookings');
  return kind === 'S' ? `DEMO-ORD-${String(n).padStart(4, '0')}` : `DEMO-BOOK-${String(n).padStart(4, '0')}`;
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
function sDel(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    mem.delete(key);
  }
}
function readKey<T>(key: string, seed: () => T): T {
  const raw = sGet(key);
  if (raw) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      /* corrupted => reseed below, never crash */
    }
  }
  const v = seed();
  sSet(key, JSON.stringify(v));
  return v;
}
function writeKey(key: string, value: unknown): void {
  sSet(key, JSON.stringify(value));
}
/** Restore the initial sample dataset (also used by the demo reset UI). */
export function clearDemoStorage(): void {
  for (const k of Object.keys(demoSeeds)) sDel(`aggad-demo:${k}`);
  sDel('aggad-demo:seq-orders');
  sDel('aggad-demo:seq-bookings');
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
  slot?: string;
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
export interface DemoPromo {
  code: string;
  percent: number;
  expires: string | null;
  demoSample: true;
}

const today = new Date().toISOString().slice(0, 10);

/** Mirrors the production blocking rule so the simulation teaches real behavior. */
export const DEMO_BLOCKING_STATUSES = ['confirmed', 'ready_for_pickup', 'checked_out', 'inspection', 'cleaning'];

export const DEMO_STATUS_LABELS: Record<BookingStatus, { ar: string; en: string }> = {
  pending_review: { ar: 'طلب تجريبي — قيد المراجعة', en: 'Demo Request — Under Review' },
  confirmed: { ar: 'مقبول — محاكاة فقط', en: 'Approved — Simulation Only' },
  ready_for_pickup: { ar: 'جاهز للاستلام — محاكاة فقط', en: 'Ready for Pickup — Simulation Only' },
  checked_out: { ar: 'مستلم — محاكاة فقط', en: 'Checked Out — Simulation Only' },
  returned: { ar: 'تم الإرجاع — محاكاة فقط', en: 'Returned — Simulation Only' },
  inspection: { ar: 'فحص — محاكاة فقط', en: 'Inspection — Simulation Only' },
  cleaning: { ar: 'تنظيف — محاكاة فقط', en: 'Cleaning — Simulation Only' },
  completed: { ar: 'مكتمل — محاكاة فقط', en: 'Completed — Simulation Only' },
  cancelled: { ar: 'ملغي — محاكاة فقط', en: 'Cancelled — Simulation Only' },
};

/** Fictional appointment slots; availability derived deterministically per date. */
export const DEMO_SLOT_TIMES = ['10:00', '12:30', '15:00', '17:30'];
export function isSlotTaken(dateStr: string, time: string): boolean {
  let h = 0;
  for (const c of `${dateStr}|${time}`) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h % 3 === 0;
}
export function freeSlots(dateStr: string): string[] {
  return DEMO_SLOT_TIMES.filter((s) => !isSlotTaken(dateStr, s));
}

function seedUnits(dressId: string, code: string, sizes: string[]): DressUnit[] {
  return sizes.slice(0, 3).map((s, i) => ({
    id: `${dressId}-u${i + 1}`,
    dress_id: dressId,
    code: `${code}-U${i + 1}`,
    size_label: s,
    color_label: null,
    condition: i === 2 ? 'good' : 'excellent',
    status: i === 2 ? 'cleaning' : 'available',
  }));
}

const demoSeeds: Record<string, () => unknown> = {
  dresses: (): DemoDress[] =>
    DEMO_DRESSES.map((d) => ({ ...d, demoSample: true as const, units: seedUnits(d.id, d.code, d.sizes) })),
  bookings: (): DemoBooking[] => [
    {
      id: 'demo-b1', reference: 'DEMO-BOOK-0001', dress_id: 'demo-1', dress_code: 'AG-W-001',
      customer_name: 'Demo Bride — عروسة تجريبية', customer_phone: '+20 100 000 0001',
      start_date: today, end_date: today, slot: '12:30',
      rental_fee_minor: 900000, currency: 'EGP',
      status: 'pending_review', payment_status: 'unpaid', demoSample: true, created_at: new Date().toISOString(),
    },
    {
      id: 'demo-b2', reference: 'DEMO-BOOK-0002', dress_id: 'demo-2', dress_code: 'AG-E-001',
      customer_name: 'Sample Client — عميلة تجريبية', customer_phone: '+20 100 000 0002',
      start_date: today, end_date: today,
      rental_fee_minor: 550000, currency: 'EGP',
      status: 'confirmed', payment_status: 'partial', demoSample: true, created_at: new Date().toISOString(),
    },
  ],
  orders: (): DemoOrder[] => [
    {
      id: 'demo-o1', reference: 'DEMO-ORD-0001',
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
    address_ar: 'عنوان تجريبي — يُحدَّد عند الإطلاق', address_en: 'Demo address — set at launch',
    hours_ar: 'يومياً 11ص – 9م (تجريبي)', hours_en: 'Daily 11am – 9pm (demo)',
  }),
  promos: (): DemoPromo[] => [
    { code: 'DEMO10', percent: 10, expires: null, demoSample: true },
  ],
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
  deleteDress(id: string): void {
    writeKey('aggad-demo:dresses', demoStore.listDresses().filter((d) => d.id !== id));
  },
  updateUnit(dressId: string, unitId: string, patch: Partial<DressUnit>): void {
    writeKey('aggad-demo:dresses', demoStore.listDresses().map((d) =>
      d.id === dressId ? { ...d, units: (d.units ?? []).map((u) => (u.id === unitId ? { ...u, ...patch } : u)) } : d,
    ));
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
  listPromos(): DemoPromo[] {
    return readKey<DemoPromo[]>('aggad-demo:promos', demoSeeds.promos as () => DemoPromo[]);
  },
  addPromo(p: DemoPromo): void {
    writeKey('aggad-demo:promos', [...demoStore.listPromos(), p]);
  },
  removePromo(code: string): void {
    writeKey('aggad-demo:promos', demoStore.listPromos().filter((p) => p.code !== code));
  },
  listSubmissions(): unknown[] {
    return readKey<unknown[]>('aggad-demo:submissions', demoSeeds.submissions as () => unknown[]);
  },
};

/** Validate a promo code against local demo promos (simulation only). */
export function validatePromo(code: string): DemoPromo | null {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  const found = demoStore.listPromos().find((p) => p.code.toUpperCase() === c);
  if (!found) return null;
  if (found.expires && found.expires < today) return null;
  return found;
}

/** Demo conflict check: overlapping blocking-status demo bookings (1-day buffers). */
export function findDemoConflicts(dressId: string, start: string, end: string, excludeId?: string, buffer = 1): DemoBooking[] {
  if (!start || !end || start > end) return [];
  const s = addDaysSafe(start, -buffer);
  const e = addDaysSafe(end, buffer);
  return demoStore.listBookings().filter(
    (b) => b.dress_id === dressId && b.id !== excludeId &&
      DEMO_BLOCKING_STATUSES.includes(b.status) &&
      rangesOverlap(s, e, b.start_date, b.end_date),
  );
}
function addDaysSafe(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
/** Suggest the next free window of the same length, scanning 60 days ahead. */
export function suggestNextSlot(dressId: string, from: string, lengthDays: number): { start: string; end: string } | null {
  for (let i = 0; i < 60; i++) {
    const s = addDaysSafe(from, i);
    const e = addDaysSafe(s, Math.max(0, lengthDays));
    if (findDemoConflicts(dressId, s, e).length === 0) return { start: s, end: e };
  }
  return null;
}

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
      slot: typeof record.slot === 'string' ? record.slot : undefined,
      rental_fee_minor: Number(record.rental_fee_minor ?? 0), currency: String(record.currency ?? 'EGP'),
      status: 'pending_review', payment_status: 'unpaid',
      demoSample: true, created_at: new Date().toISOString(),
    });
  }
  return reference;
}
