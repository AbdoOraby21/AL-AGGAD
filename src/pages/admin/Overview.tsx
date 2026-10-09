import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { demoStore, isDemoMode } from '../../lib/demo';
import { useLang } from '../../app/LanguageContext';
import { t } from '../../lib/i18n';

interface Counts { dresses: number; activeBookings: number; pendingBookings: number; orders: number; }

export function AdminOverview() {
  const { locale } = useLang();
  const [c, setC] = useState<Counts>({ dresses: 0, activeBookings: 0, pendingBookings: 0, orders: 0 });
  useEffect(() => {
    if (isDemoMode()) {
      // Sample metrics from local fixtures — clearly marked, DB-independent.
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
  }, []);
  const cards: Array<[string, number]> = [
    [t(locale, 'dresses'), c.dresses],
    [locale === 'ar' ? 'حجوزات نشطة' : 'Active bookings', c.activeBookings],
    [locale === 'ar' ? 'طلبات قيد المراجعة' : 'Pending review', c.pendingBookings],
    [t(locale, 'orders'), c.orders],
  ];
  return (
    <div>
      <h1 className="font-heading text-3xl mb-1">{t(locale, 'dashboard')}</h1>
      {isDemoMode() && (
        <p className="text-xs bg-gold/15 border border-gold/40 rounded-xl p-3 mb-4">
          {t(locale, 'demo_banner')} — {t(locale, 'demo_sample')}
        </p>
      )}
      <p className="text-xs text-stone-soft mb-5">{locale === 'ar' ? 'الإيرادات المعتمدة = الطلبات والحجوزات المدفوعة/المؤكدة فقط — لا تُحتسب الطلبات المعلقة كإيراد.' : 'Confirmed revenue counts paid/confirmed records only — pending items are never revenue.'}</p>
      {!isSupabaseConfigured && <p className="text-sm bg-champagne/40 border border-champagne rounded-2xl p-3 mb-4">{locale === 'ar' ? 'وضع عدم الاتصال: اربطي Supabase لعرض مؤشرات حقيقية (انظر README).' : 'Offline mode: connect Supabase for live metrics (see README).'}</p>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(([label, n]) => (
          <div key={label} className="bg-white border border-champagne rounded-2xl p-5">
            <p className="text-3xl font-heading">{n}</p>
            <p className="text-sm text-stone-soft mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
