/**
 * Single audited mutation path for visitor checkout & rental requests.
 * Demo mode is checked FIRST: demo submissions are stored locally only
 * (see lib/demo.ts) and this function returns before touching Supabase,
 * so no booking/order/payment/customer write can ever fire in demo mode.
 */
import { supabase, isSupabaseConfigured } from './supabase';
import { isDemoMode, saveDemoRecord } from './demo';

export interface OrderItemInput {
  dressId: string;
  code: string;
  name: string;
  size?: string;
  color?: string;
  priceMinor: number;
  qty: number;
}
export interface OrderInput {
  name: string;
  phone: string;
  fulfillment: string;
  notes?: string;
  items: OrderItemInput[];
  totalMinor: number;
  currency?: string;
}
export interface BookingInput {
  dressId: string;
  dressCode: string;
  name: string;
  phone: string;
  occasionDate?: string;
  startDate: string;
  endDate: string;
  size?: string;
  color?: string;
  rentalFeeMinor: number;
  bookingDepositMinor: number;
  securityDepositMinor: number;
  currency?: string;
}

/** Demo checkout: local record only. No Supabase, no payment initiation. */
export function submitDemoOrder(input: OrderInput): string {
  return saveDemoRecord('orders', {
    customer_name: input.name,
    customer_phone: input.phone,
    fulfillment_method: input.fulfillment,
    customer_notes: input.notes ?? null,
    total_minor: input.totalMinor,
    currency: input.currency ?? 'EGP',
    items: input.items.map((i) => ({
      dress_code: i.code,
      name_snapshot: i.name,
      size_label: i.size ?? null,
      color_label: i.color ?? null,
      unit_price_minor: i.priceMinor,
      quantity: i.qty,
    })),
  });
}

/** Demo booking request: local record only. Nothing is reserved. */
export function submitDemoBooking(input: BookingInput): string {
  return saveDemoRecord('bookings', {
    dress_id: input.dressId,
    dress_code: input.dressCode,
    customer_name: input.name,
    customer_phone: input.phone,
    occasion_date: input.occasionDate ?? null,
    start_date: input.startDate,
    end_date: input.endDate,
    size_label: input.size ?? null,
    color_label: input.color ?? null,
    rental_fee_minor: input.rentalFeeMinor,
    booking_deposit_minor: input.bookingDepositMinor,
    security_deposit_minor: input.securityDepositMinor,
    currency: input.currency ?? 'EGP',
  });
}

function liveOrderRef(): string {
  return `AG-S-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}
function liveBookingRef(): string {
  return `AG-R-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Full order submission. Returns { reference, demo }.
 * Throws on live-path failures (caller surfaces the message).
 */
export async function submitSalesOrder(input: OrderInput): Promise<{ reference: string; demo: boolean }> {
  if (isDemoMode()) return { reference: submitDemoOrder(input), demo: true };
  if (!isSupabaseConfigured) return { reference: liveOrderRef(), demo: false };
  const reference = liveOrderRef();
  const { data: order, error } = await supabase.from('sales_orders').insert({
    reference,
    customer_name: input.name,
    customer_phone: input.phone,
    fulfillment_method: input.fulfillment,
    customer_notes: input.notes ?? null,
    total_minor: input.totalMinor,
    currency: input.currency ?? 'EGP',
    status: 'pending',
    payment_status: 'unpaid',
    fulfillment_status: 'pending',
  }).select('id').single();
  if (error || !order) throw new Error(error?.message ?? 'order failed');
  const rows = input.items.map((i) => ({
    order_id: (order as { id: string }).id,
    dress_id: i.dressId,
    dress_code: i.code,
    name_snapshot: i.name,
    size_label: i.size ?? null,
    color_label: i.color ?? null,
    unit_price_minor: i.priceMinor,
    quantity: i.qty,
  }));
  const { error: e2 } = await supabase.from('sales_order_items').insert(rows);
  if (e2) throw new Error(e2.message);
  return { reference, demo: false };
}

/** Full booking-request submission. Pending review only — never confirmed here. */
export async function submitRentalBooking(input: BookingInput): Promise<{ reference: string; demo: boolean }> {
  if (isDemoMode()) return { reference: submitDemoBooking(input), demo: true };
  if (!isSupabaseConfigured) return { reference: liveBookingRef(), demo: false };
  const reference = liveBookingRef();
  const { error } = await supabase.from('rental_bookings').insert({
    reference,
    dress_id: input.dressId,
    customer_name: input.name,
    customer_phone: input.phone,
    occasion_date: input.occasionDate ?? null,
    start_date: input.startDate,
    end_date: input.endDate,
    size_label: input.size ?? null,
    color_label: input.color ?? null,
    rental_fee_minor: input.rentalFeeMinor,
    booking_deposit_minor: input.bookingDepositMinor,
    security_deposit_minor: input.securityDepositMinor,
    currency: input.currency ?? 'EGP',
    status: 'pending_review',
    payment_status: 'unpaid',
    idempotency_key: `${input.dressId}|${input.phone}|${input.startDate}|${input.endDate}`,
    terms_snapshot: JSON.stringify({ rental: input.rentalFeeMinor, deposit: input.securityDepositMinor }),
  });
  if (error) throw new Error(error.message);
  return { reference, demo: false };
}
