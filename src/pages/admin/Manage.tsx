import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { demoStore, isDemoMode } from '../../lib/demo';
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
  return (
    <div>
      <h1 className="font-heading text-3xl mb-4">{locale === 'ar' ? 'العميلات' : 'Customers'}</h1>
      {isDemoMode() && <p className="text-xs bg-gold/15 border border-gold/40 rounded-xl p-3 mb-4">{t(locale, 'demo_banner')}</p>}
      <div className="bg-white border border-champagne rounded-2xl divide-y divide-champagne/60">
        {list.map((c) => (
          <div key={c.id} className="p-4 text-sm"><p className="font-medium">{c.full_name}</p><p className="text-stone-soft" dir="ltr">{c.phone}</p></div>
        ))}
        {list.length === 0 && <p className="p-4 text-sm text-stone-soft">{locale === 'ar' ? 'تُنشأ سجلات العميلات تلقائياً من الطلبات والحجوزات.' : 'Customer records are created automatically from orders & bookings.'}</p>}
      </div>
    </div>
  );
}

export function AdminSettings() {
  const { locale } = useLang();
  const { push } = useToast();
  const [form, setForm] = useState({ whatsapp_number: '', currency: 'EGP', boutique_name_ar: 'العقاد', boutique_name_en: 'AL AGGAD', announcement_ar: '', announcement_en: '' });
  useEffect(() => {
    if (isDemoMode()) {
      setForm((f) => ({ ...f, ...(demoStore.getSettings() as Partial<typeof f>) }));
      return;
    }
    if (!isSupabaseConfigured) return;
    supabase.from('business_settings').select('*').limit(1).single().then(({ data }) => { if (data) setForm((f) => ({ ...f, ...data })); });
  }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode()) {
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
      {isDemoMode() && <p className="text-xs bg-gold/15 border border-gold/40 rounded-xl p-3 mb-4">{t(locale, 'demo_banner')}</p>}
      <form onSubmit={save} className="bg-white border border-champagne rounded-3xl p-5 grid sm:grid-cols-2 gap-3">
        <label className="text-sm">اسم البوتيك (عربي)<input value={form.boutique_name_ar} onChange={(e) => setForm({ ...form, boutique_name_ar: e.target.value })} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm" dir="ltr">Boutique name (EN)<input value={form.boutique_name_en} onChange={(e) => setForm({ ...form, boutique_name_en: e.target.value })} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm" dir="ltr">WhatsApp (digits)<input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="2010XXXXXXXX" className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm" dir="ltr">Currency<input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <div className="sm:col-span-2"><button className="bg-cocoa text-ivory rounded-full px-6 py-2.5 text-sm">{locale === 'ar' ? 'حفظ' : 'Save'}</button></div>
      </form>
    </div>
  );
}
