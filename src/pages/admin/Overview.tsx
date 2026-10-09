import { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { demoStore, isDemoMode } from '../../lib/demo';
import { useLang } from '../../app/LanguageContext';
import { t } from '../../lib/i18n';
import { formatMoney } from '../../lib/money';

interface Counts { dresses: number; activeBookings: number; pendingBookings: number; orders: number; }

/** Tiny dependency-free SVG bar chart (demo figures only). */
function Bars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-1.5 h-28" role="img" aria-label="chart">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${labels[i]}: ${v}`}>
          <div className="w-full rounded-t-lg bg-gradient-to-t from-gold-deep to-champagne" style={{ height: `${Math.max(4, (v / max) * 96)}px` }} />
          <span className="text-[9px] text-stone-soft">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function AdminOverview() {
  const { locale } = useLang();
  const [c, setC] = useState<Counts>({ dresses: 0, activeBookings: 0, pendingBookings: 0, orders: 0 });
  const demo = isDemoMode();
  useEffect(() => {
    if (demo) {
      const bookings = demoStore.listBookings();
      const orders = demoStore.listOrders();
      setC({
        dresses: demoStore.listDresses().length,
        activeBookings: bookings.filter((b) => ['confirmed', 'ready_for_pickup', 'checked_out'].includes(b.status)).length,
        pendingBookings: bookings.filter((b) => b.status === 'pending_review').length,
        orders: orders.length,
      });
      return;
    }
    if (!isSupabaseConfigured) return;
    (async () => {
      const [d, ab, pb, o] = await Promise.all([
        supabase.from('dresses').select('id', { count: 'exact', head: true }),
        supabase.from('rental_bookings').select('id', { count: 'exact', head: true }).in('status', ['confirmed', 'ready_for_pickup', 'checked_out']),
        supabase.from('rental_bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('sales_orders').select('id', { count: 'exact', head: true }),
      ]);
      setC({ dresses: d.count ?? 0, activeBookings: ab.count ?? 0, pendingBookings: pb.count ?? 0, orders: o.count ?? 0 });
    })();
  }, [demo]);

  const charts = useMemo(() => {
    if (!demo) return null;
    const dresses = demoStore.listDresses();
    const bookings = demoStore.listBookings();
    const orders = demoStore.listOrders();
    const revenueMinor = orders.filter((o) => o.payment_status !== 'cancelled').reduce((s, o) => s + o.total_minor, 0)
      + bookings.filter((b) => b.payment_status === 'paid').reduce((s, b) => s + b.rental_fee_minor, 0);
    const saleCount = dresses.filter((d) => d.sale_enabled).length;
    const rentalCount = dresses.filter((d) => d.rental_enabled).length;
    const byStatus = ['pending_review', 'confirmed', 'checked_out', 'completed', 'cancelled'].map(
      (s) => bookings.filter((b) => b.status === s).length,
    );
    // Simulated 8-week trend scaled from the live demo order count (labeled as such).
    const base = Math.max(1, orders.length);
    const trend = [0.4, 0.6, 0.5, 0.8, 0.7, 1, 0.9, 1.2].map((f) => Math.round(base * f * 3));
    return { revenueMinor, saleCount, rentalCount, byStatus, trend };
  }, [demo, c]);

  const cards: Array<[string, number]> = [
    [t(locale, 'dresses'), c.dresses],
    [locale === 'ar' ? 'حجوزات نشطة' : 'Active bookings', c.activeBookings],
    [locale === 'ar' ? 'طلبات قيد المراجعة' : 'Pending review', c.pendingBookings],
    [t(locale, 'orders'), c.orders],
  ];
  return (
    <div>
      <h1 className="font-heading text-3xl mb-1">{t(locale, 'dashboard')}</h1>
      <p className="text-xs text-stone-soft mb-5">{locale === 'ar' ? 'الإيرادات المعتمدة = الطلبات والحجوزات المدفوعة/المؤكدة فقط — لا تُحتسب الطلبات المعلقة كإيراد.' : 'Confirmed revenue counts paid/confirmed records only — pending items are never revenue.'}</p>
      {demo && (
        <p className="text-xs bg-gold/15 border border-gold/40 rounded-xl p-3 mb-4">
          {t(locale, 'demo_banner')} — {t(locale, 'demo_sample')} · {t(locale, 'revenue_sim')}: {charts ? formatMoney(charts.revenueMinor, 'EGP', locale) : '—'}
        </p>
      )}
      {!demo && !isSupabaseConfigured && <p className="text-sm bg-champagne/40 border border-champagne rounded-2xl p-3 mb-4">{locale === 'ar' ? 'وضع عدم الاتصال: اربطي Supabase لعرض مؤشرات حقيقية (انظر README).' : 'Offline mode: connect Supabase for live metrics (see README).'}</p>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(([label, n]) => (
          <div key={label} className="bg-white border border-champagne rounded-2xl p-5">
            <p className="text-3xl font-heading">{n}</p>
            <p className="text-sm text-stone-soft mt-1">{label}</p>
          </div>
        ))}
      </div>
      {demo && charts && (
        <div className="grid md:grid-cols-3 gap-3 mt-4">
          <div className="bg-white border border-champagne rounded-2xl p-5">
            <h2 className="text-sm font-medium mb-3">{t(locale, 'trend_sim')}</h2>
            <Bars values={charts.trend} labels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8']} />
          </div>
          <div className="bg-white border border-champagne rounded-2xl p-5">
            <h2 className="text-sm font-medium mb-3">{t(locale, 'booking_status_dist')}</h2>
            <Bars values={charts.byStatus} labels={['pend', 'conf', 'out', 'done', 'cx']} />
          </div>
          <div className="bg-white border border-champagne rounded-2xl p-5">
            <h2 className="text-sm font-medium mb-3">{t(locale, 'inventory_dist')}</h2>
            <Bars values={[charts.saleCount, charts.rentalCount]} labels={[t(locale, 'shop'), t(locale, 'rent')]} />
            <p className="text-xs text-stone-soft mt-2">{t(locale, 'demo_sample')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
