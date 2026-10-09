/** Format integer minor units (e.g. piastres) as a localized currency string. */
export function formatMoney(minor: number | null | undefined, currency = 'EGP', locale: 'ar' | 'en' = 'ar'): string {
  if (minor == null) return '—';
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency,
      maximumFractionDigits: major % 1 === 0 ? 0 : 2,
    }).format(major);
  } catch {
    return `${major.toLocaleString()} ${currency}`;
  }
}

export function toMinor(major: number | string): number {
  const n = typeof major === 'string' ? parseFloat(major) : major;
  return Math.round(n * 100);
}

export function formatDate(iso: string | null | undefined, locale: 'ar' | 'en' = 'ar'): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
