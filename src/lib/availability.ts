import type { BookingStatus } from './types';
import { BLOCKING_BOOKING_STATUSES } from './types';

export interface DateRange { start: string; end: string; } // ISO yyyy-mm-dd

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/**
 * Pure availability check used by both the client (instant feedback) and as
 * documentation of the server rule enforced in SQL (see migration 0002:
 * fn_confirm_booking rechecks inside a transaction with row locks).
 * A unit is free when no BLOCKING booking overlaps [start-buffer, end+buffer].
 */
export function isUnitAvailable(
  bookings: Array<{ start_date: string; end_date: string; status: BookingStatus }>,
  start: string,
  end: string,
  pickupBuffer = 0,
  returnBuffer = 0,
): boolean {
  const wantStart = addDays(start, -pickupBuffer);
  const wantEnd = addDays(end, returnBuffer);
  return !bookings
    .filter((b) => (BLOCKING_BOOKING_STATUSES as string[]).includes(b.status))
    .some((b) => rangesOverlap(wantStart, wantEnd, b.start_date, b.end_date));
}

/** Rental total = fee - discount + extras + late + damage. All minor units. */
export function bookingBalance(b: {
  rental_fee_minor: number;
  discount_minor?: number;
  extra_charges_minor?: number;
  late_fee_minor?: number;
  damage_charge_minor?: number;
  paid_minor?: number;
}): { total: number; balance: number } {
  const total =
    b.rental_fee_minor - (b.discount_minor ?? 0) +
    (b.extra_charges_minor ?? 0) + (b.late_fee_minor ?? 0) + (b.damage_charge_minor ?? 0);
  return { total, balance: total - (b.paid_minor ?? 0) };
}
