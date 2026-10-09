import { describe, it, expect } from 'vitest';
import { isUnitAvailable, addDays, bookingBalance, rangesOverlap } from '../src/lib/availability';
import { buildWhatsAppUrl } from '../src/lib/whatsapp';
import { formatMoney } from '../src/lib/money';

describe('rental availability (critical rule)', () => {
  const confirmed = [
    { start_date: '2026-11-10', end_date: '2026-11-14', status: 'confirmed' as const },
  ];
  it('blocks overlapping confirmed rentals', () => {
    expect(isUnitAvailable(confirmed, '2026-11-12', '2026-11-16')).toBe(false);
  });
  it('allows non-overlapping rentals', () => {
    expect(isUnitAvailable(confirmed, '2026-11-15', '2026-11-18')).toBe(true);
  });
  it('applies pickup/return buffers', () => {
    expect(isUnitAvailable(confirmed, '2026-11-15', '2026-11-18', 1, 1)).toBe(false); // buffer touches 14th
  });
  it('ignores pending requests (they never silently confirm)', () => {
    expect(isUnitAvailable(
      [{ start_date: '2026-11-12', end_date: '2026-11-16', status: 'pending_review' as const }],
      '2026-11-12', '2026-11-16',
    )).toBe(true);
  });
  it('treats cleaning/inspection as blocking', () => {
    expect(isUnitAvailable(
      [{ start_date: '2026-11-12', end_date: '2026-11-16', status: 'cleaning' as const }],
      '2026-11-13', '2026-11-13',
    )).toBe(false);
  });
  it('rangesOverlap edge: touching same-day counts as overlap (inclusive)', () => {
    expect(rangesOverlap('2026-11-10', '2026-11-14', '2026-11-14', '2026-11-16')).toBe(true);
  });
  it('addDays works across month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });
});

describe('money', () => {
  it('uses integer minor units; totals stay exact', () => {
    const { total, balance } = bookingBalance({ rental_fee_minor: 900000, discount_minor: 50000, extra_charges_minor: 10000, paid_minor: 200000 });
    expect(total).toBe(860000);
    expect(balance).toBe(660000);
  });
  it('formats without float artifacts', () => {
    expect(formatMoney(4500000, 'EGP', 'en')).toContain('45');
  });
});

describe('whatsapp', () => {
  it('encodes product, intent, dates and ref', () => {
    const url = buildWhatsAppUrl({ to: '201000000000', productName: 'فستان', productCode: 'AG-W-001', intent: 'rental', size: 'M', occasionDate: '2026-12-01', bookingRef: 'AG-R-2026-1', lang: 'ar' });
    expect(url.startsWith('https://wa.me/201000000000?text=')).toBe(true);
    const text = decodeURIComponent(url.split('text=')[1]);
    expect(text).toContain('AG-W-001');
    expect(text).toContain('تأجير');
    expect(text).toContain('AG-R-2026-1');
  });
});
