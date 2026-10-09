import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { demoStore, isDemoMode, clearDemoStorage } from '../../lib/demo';
import { useToast } from '../../app/ToastContext';
import { useLang } from '../../app/LanguageContext';
import { t } from '../../lib/i18n';
import { formatMoney, formatDate } from '../../lib/money';
import { BOOKING_STATUSES, type BookingStatus, type RentalBooking } from '../../lib/types';

export function AdminBookings() {
  const { locale } = useLang();
  const { push } = useToast();
  const [list, setList] = useState<RentalBooking[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const load = async () => {
    if (isDemoMode()) {
      const all = demoStore.listBookings();
      setList((filter === 'all' ? all : all.filter((b) => b.status === filter)) as unknown as RentalBooking[]);
      return;
    }
    if (!isSupabaseConfigured) return;
    let q = supabase.from('rental_bookings').select('*').order('created_at', { ascending: false }).limit(200);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setList((data ?? []) as RentalBooking[]);
  };
  useEffect(() => { void load(); }, [filter]);

  /** Confirm goes through the server-side function that rechecks overlaps
   *  inside a transaction with row locks — never trust the client alone. */
  const setStatus = async (b: RentalBooking, status: BookingStatus) => {
    if ((status === 'cancelled' || status === 'completed') && !confirm(locale === 'ar' ? 'تأكيد هذا الإجراء المالي/النهائي؟' : 'Confirm this final/financial action?')) return;
    if (isDemoMode()) {
      // Local sample status change only — no confirm_booking RPC, no DB write.
      demoStore.updateBooking(b.id, { status });
      push('success', `${t(locale, 'demo_sample')} — ${locale === 'ar' ? 'تم التحديث محلياً' : 'updated locally'}`);
      void load();
      return;
    }
    if (status === 'confirmed') {
      const { error } = await supabase.rpc('confirm_booking', { p_booking_id: b.id });
      if (error) { push('error', error.message); return; }
    } else {
      const { error } = await supabase.from('rental_bookings').update({ status }).eq('id', b.id);
      if (error) { push('error', error.message); return; }
    }
    push('success', locale === 'ar' ? 'تم تحديث الحجز' : 'Booking updated');
    void load();
  };

  return (
    <div>
      <h1 className="font-heading text-3xl mb-4">{locale === 'ar' ? 'إدارة الحجوزات' : 'Booking Management'}</h1>
      {isDemoMode() && <p className="text-xs bg-gold/15 border border-gold/40 rounded-xl p-3 mb-4">{t(locale, 'demo_banner')}</p>}
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-4 border border-champagne bg-white rounded-full px-4 py-2 text-sm">
        <option value="all">{locale === 'ar' ? 'كل الحالات' : 'All statuses'}</option>
        {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <div className="space-y-2">
        {list.map((b) => (
          <div key={b.id} className="bg-white border border-champagne rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <p className="font-medium" dir="ltr">{b.reference} <span className="text-xs bg-champagne/60 rounded-full px-2 py-0.5">{b.status}</span></p>
              <p className="text-sm font-semibold">{formatMoney(b.rental_fee_minor, b.currency, locale)}</p>
            </div>
            <p className="text-xs text-stone-soft mt-1">{b.customer_name} · <span dir="ltr">{b.customer_phone}</span> · {formatDate(b.start_date, locale)} → {formatDate(b.end_date, locale)}</p>
            <div className="mt-2 flex gap-2 flex-wrap">
              {(['pending_review', 'confirmed', 'ready_for_pickup', 'checked_out', 'returned', 'completed', 'cancelled'] as BookingStatus[]).map((s) => (
                <button key={s} disabled={b.status === s} onClick={() => void setStatus(b, s)} className="text-[11px] border border-champagne rounded-full px-2.5 py-1 disabled:opacity-40 hover:bg-champagne/50">{s}</button>
              ))}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-stone-soft">{locale === 'ar' ? 'لا توجد حجوزات بعد.' : 'No bookings yet.'}</p>}
      </div>
    </div>
  );
}

export function AdminOrders() {
  const { locale } = useLang();
  const { push } = useToast();
  const [list, setList] = useState<any[]>([]);
  const load = async () => {
    if (isDemoMode()) {
      setList(demoStore.listOrders());
      return;
    }
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.from('sales_orders').select('*, items:sales_order_items(*)').order('created_at', { ascending: false }).limit(200);
    setList(data ?? []);
  };
  useEffect(() => { void load(); }, []);
  const update = async (id: string, patch: Record<string, string>) => {
    if (patch.status === 'cancelled' && !confirm(locale === 'ar' ? 'تأكيد إلغاء الطلب؟' : 'Confirm cancellation?')) return;
    if (isDemoMode()) {
      demoStore.updateOrder(id, patch);
      push('success', `${t(locale, 'demo_sample')} — OK`);
      void load();
      return;
    }
    const { error } = await supabase.from('sales_orders').update(patch).eq('id', id);
    if (error) push('error', error.message); else { push('success', 'OK'); void load(); }
  };
  return (
    <div>
      <h1 className="font-heading text-3xl mb-4">{locale === 'ar' ? 'طلبات البيع' : 'Sales Orders'}</h1>
      {isDemoMode() && <p className="text-xs bg-gold/15 border border-gold/40 rounded-xl p-3 mb-4">{t(locale, 'demo_banner')}</p>}
      <div className="space-y-2">
        {list.map((o) => (
          <div key={o.id} className="bg-white border border-champagne rounded-2xl p-4">
            <div className="flex justify-between flex-wrap gap-2">
              <p className="font-medium" dir="ltr">{o.reference} <span className="text-xs bg-champagne/60 rounded-full px-2 py-0.5">{o.status} / {o.payment_status} / {o.fulfillment_status}</span></p>
              <p className="font-semibold">{formatMoney(o.total_minor, o.currency, locale)}</p>
            </div>
            <p className="text-xs text-stone-soft mt-1">{o.customer_name} · <span dir="ltr">{o.customer_phone}</span> · {o.fulfillment_method} · {(o.items ?? []).length} items</p>
            <div className="mt-2 flex gap-2 flex-wrap text-[11px]">
              <button className="border border-champagne rounded-full px-2.5 py-1" onClick={() => void update(o.id, { status: 'confirmed' })}>confirm</button>
              <button className="border border-champagne rounded-full px-2.5 py-1" onClick={() => void update(o.id, { payment_status: 'paid' })}>mark paid</button>
              <button className="border border-champagne rounded-full px-2.5 py-1" onClick={() => void update(o.id, { fulfillment_status: 'delivered' })}>delivered</button>
              <button className="border border-champagne rounded-full px-2.5 py-1" onClick={() => void update(o.id, { status: 'cancelled' })}>cancel</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-stone-soft">{locale === 'ar' ? 'لا توجد طلبات بعد.' : 'No orders yet.'}</p>}
      </div>
    </div>
  );
}

export function AdminCustomers() {
  const { locale } = useLang();
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    if (isDemoMode()) {
      // Fictional sample contacts only — never production data.
      setList(demoStore.listCustomers());
      return;
    }
    if (!isSupabaseConfigured) return;
    supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(200).then(({ data }) => setList(data ?? []));
  }, []);
  const demo = isDemoMode();
  const historyFor = (phone: string) => {
    if (!demo) return null;
    const orders = demoStore.listOrders().filter((o) => o.customer_phone === phone);
    const bookings = demoStore.listBookings().filter((b) => b.customer_phone === phone);
    return { orders, bookings };
  };
  return (
    <div>
      <h1 className="font-heading text-3xl mb-4">{locale === 'ar' ? 'العميلات' : 'Customers'}</h1>
      {isDemoMode() && <p className="text-xs bg-gold/15 border border-gold/40 rounded-xl p-3 mb-4">{t(locale, 'demo_banner')}</p>}
      <div className="bg-white border border-champagne rounded-2xl divide-y divide-champagne/60">
        {list.map((c) => {
          const h = historyFor(c.phone);
          return (
            <div key={c.id} className="p-4 text-sm">
              <p className="font-medium">{c.full_name}{c.demoSample && <span className="ms-2 text-[10px] bg-gold-deep text-white px-2 py-0.5 rounded-full">{t(locale, 'demo_sample')}</span>}</p>
              <p className="text-stone-soft" dir="ltr">{c.phone}</p>
              {h && <p className="text-xs text-stone-soft mt-1">{t(locale, 'customer_history')}: {h.orders.length} {t(locale, 'orders')} · {h.bookings.length} {t(locale, 'bookings')}</p>}
            </div>
          );
        })}
        {list.length === 0 && <p className="p-4 text-sm text-stone-soft">{locale === 'ar' ? 'تُنشأ سجلات العميلات تلقائياً من الطلبات والحجوزات.' : 'Customer records are created automatically from orders & bookings.'}</p>}
      </div>
    </div>
  );
}

export function AdminSettings() {
  const { locale } = useLang();
  const { push } = useToast();
  const demo = isDemoMode();
  const [form, setForm] = useState({ whatsapp_number: '', currency: 'EGP', boutique_name_ar: 'العقاد', boutique_name_en: 'AL AGGAD', announcement_ar: '', announcement_en: '', address_ar: '', address_en: '', hours_ar: '', hours_en: '' });
  const [promos, setPromos] = useState<Array<{ code: string; percent: number; expires: string | null }>>([]);
  const [newCode, setNewCode] = useState('');
  const [newPct, setNewPct] = useState('10');
  useEffect(() => {
    if (demo) {
      setForm((f) => ({ ...f, ...(demoStore.getSettings() as Partial<typeof f>) }));
      setPromos(demoStore.listPromos());
      return;
    }
    if (!isSupabaseConfigured) return;
    supabase.from('business_settings').select('*').limit(1).single().then(({ data }) => { if (data) setForm((f) => ({ ...f, ...data })); });
  }, [demo]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo) {
      demoStore.saveSettings(form);
      push('success', `${t(locale, 'demo_sample')} — ${locale === 'ar' ? 'حُفظ محلياً' : 'saved locally'}`);
      return;
    }
    if (!isSupabaseConfigured) { push('info', 'Connect Supabase first'); return; }
    const { error } = await supabase.from('business_settings').upsert({ id: 1, ...form, updated_at: new Date().toISOString() });
    if (error) push('error', error.message); else push('success', locale === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved');
  };
  return (
    <div>
      <h1 className="font-heading text-3xl mb-4">{locale === 'ar' ? 'إعدادات البوتيك' : 'Business Settings'}</h1>
      {demo && <p className="text-xs bg-gold/15 border border-gold/40 rounded-xl p-3 mb-4">{t(locale, 'demo_banner')} · {t(locale, 'demo_local_note')}</p>}
      <form onSubmit={save} className="bg-white border border-champagne rounded-3xl p-5 grid sm:grid-cols-2 gap-3">
        <label className="text-sm">اسم البوتيك (عربي)<input value={form.boutique_name_ar} onChange={(e) => setForm({ ...form, boutique_name_ar: e.target.value })} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm" dir="ltr">Boutique name (EN)<input value={form.boutique_name_en} onChange={(e) => setForm({ ...form, boutique_name_en: e.target.value })} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm" dir="ltr">WhatsApp (digits)<input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="2010XXXXXXXX" className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm" dir="ltr">Currency<input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm">العنوان (عربي)<input value={form.address_ar} onChange={(e) => setForm({ ...form, address_ar: e.target.value })} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm" dir="ltr">Address (EN)<input value={form.address_en} onChange={(e) => setForm({ ...form, address_en: e.target.value })} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm">المواعيد (عربي)<input value={form.hours_ar} onChange={(e) => setForm({ ...form, hours_ar: e.target.value })} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm" dir="ltr">Hours (EN)<input value={form.hours_en} onChange={(e) => setForm({ ...form, hours_en: e.target.value })} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <div className="sm:col-span-2 flex gap-2 flex-wrap">
          <button className="bg-cocoa text-ivory rounded-full px-6 py-2.5 text-sm">{locale === 'ar' ? 'حفظ' : 'Save'}</button>
          {demo && (
            <button type="button" onClick={() => { if (confirm(t(locale, 'reset_demo'))) { clearDemoStorage(); window.location.reload(); } }}
              className="border border-gold text-gold-deep rounded-full px-6 py-2.5 text-sm">
              {t(locale, 'reset_demo')}
            </button>
          )}
        </div>
      </form>
      {demo && (
        <div className="mt-4 bg-white border border-champagne rounded-3xl p-5">
          <h2 className="font-medium mb-1">{t(locale, 'promos')} <span className="text-[10px] bg-gold-deep text-white px-2 py-0.5 rounded-full">{t(locale, 'demo_sample')}</span></h2>
          <p className="text-xs text-stone-soft mb-3">{t(locale, 'demo_local_note')}</p>
          <div className="space-y-2">
            {promos.map((p) => (
              <div key={p.code} className="flex items-center justify-between text-sm border border-champagne/60 rounded-xl px-3 py-2">
                <span dir="ltr" className="font-medium">{p.code} — {p.percent}%{p.expires ? ` · ${t(locale, 'expires')}: ${p.expires}` : ''}</span>
                <button onClick={() => { demoStore.removePromo(p.code); setPromos(demoStore.listPromos()); }} className="text-xs underline text-stone-soft">{t(locale, 'remove')}</button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="CODE" dir="ltr" className="w-32 border border-champagne rounded-xl px-3 py-2 text-sm" />
            <input value={newPct} onChange={(e) => setNewPct(e.target.value.replace(/[^0-9]/g, ''))} placeholder="10" dir="ltr" className="w-20 border border-champagne rounded-xl px-3 py-2 text-sm" />
            <button onClick={() => {
              if (!newCode.trim() || !Number(newPct)) return;
              demoStore.addPromo({ code: newCode.trim().toUpperCase(), percent: Math.min(90, Number(newPct)), expires: null, demoSample: true });
              setPromos(demoStore.listPromos()); setNewCode(''); setNewPct('10');
            }} className="bg-cocoa text-ivory rounded-full px-5 py-2 text-sm">{t(locale, 'add_promo')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminReports() {
  const { locale } = useLang();
  const demo = isDemoMode();
  const [period, setPeriod] = useState<'all' | '30'>('all');
  if (!demo) {
    return (
      <div>
        <h1 className="font-heading text-3xl mb-4">{t(locale, 'reports')}</h1>
        <p className="text-sm text-stone-soft bg-white border border-champagne rounded-2xl p-4">
          {locale === 'ar' ? 'التقارير المالية للإنتاج تتطلب ربط Supabase. نسخة العرض تعمل ببيانات محلية فقط.' : 'Production financial reports require Supabase. The demo runs on local data only.'}
        </p>
      </div>
    );
  }
  const cutoff = period === '30' ? new Date(Date.now() - 30 * 86400000).toISOString() : '';
  const orders = demoStore.listOrders().filter((o) => !cutoff || o.created_at >= cutoff);
  const bookings = demoStore.listBookings().filter((b) => !cutoff || b.created_at >= cutoff);
  const salesTotal = orders.reduce((s, o) => s + o.total_minor, 0);
  const rentalTotal = bookings.reduce((s, b) => s + b.rental_fee_minor, 0);
  const deposits = bookings.reduce((s, b) => s + 0, 0);
  const rows: Array<[string, string]> = [
    [t(locale, 'total_sales'), String(salesTotal)],
    [t(locale, 'total_rental'), String(rentalTotal)],
    [t(locale, 'deposits_sim'), String(deposits)],
  ];
  const exportCsv = () => {
    const lines = ['type,reference,customer,total_minor,currency,status',
      ...orders.map((o) => `order,${o.reference},"${o.customer_name}",${o.total_minor},${o.currency},${o.status}`),
      ...bookings.map((b) => `booking,${b.reference},"${b.customer_name}",${b.rental_fee_minor},${b.currency},${b.status}`)];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'al-aggad-demo-report.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div>
      <h1 className="font-heading text-3xl mb-1">{t(locale, 'reports')}</h1>
      <p className="text-xs bg-gold/15 border border-gold/40 rounded-xl p-3 mb-4">{t(locale, 'demo_banner')} · {t(locale, 'revenue_sim')}</p>
      <div className="flex gap-2 items-center mb-4 text-sm">
        <span className="text-stone-soft">{t(locale, 'period')}:</span>
        <select value={period} onChange={(e) => setPeriod(e.target.value as 'all' | '30')} className="border border-champagne bg-white rounded-full px-4 py-2">
          <option value="all">{t(locale, 'all_time')}</option>
          <option value="30">{t(locale, 'last_30')}</option>
        </select>
        <button onClick={exportCsv} className="ms-auto border border-cocoa rounded-full px-4 py-2 text-xs">⬇ {t(locale, 'export_csv')}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rows.map(([label, minor]) => (
          <div key={label} className="bg-white border border-champagne rounded-2xl p-5">
            <p className="text-2xl font-heading" dir="ltr">{formatMoney(Number(minor), 'EGP', locale)}</p>
            <p className="text-sm text-stone-soft mt-1">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-soft mt-3">{locale === 'ar' ? 'أرقام استرشادية وليست سجلات محاسبية أو تدفقاً نقدياً فعلياً.' : 'Illustrative figures — not accounting records or actual cash flow.'}</p>
    </div>
  );
}
