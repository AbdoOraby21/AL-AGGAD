import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { demoStore, isDemoMode } from '../../lib/demo';
import { useToast } from '../../app/ToastContext';
import { useLang } from '../../app/LanguageContext';
import { t } from '../../lib/i18n';
import { formatMoney } from '../../lib/money';
import type { Dress } from '../../lib/types';

const schema = z.object({
  code: z.string().min(3),
  name_ar: z.string().min(2),
  name_en: z.string().min(2),
  category_slug: z.enum(['wedding', 'engagement']),
  sale_enabled: z.boolean().default(true),
  sale_price: z.string().optional(),
  rental_enabled: z.boolean().default(true),
  rental_price: z.string().optional(),
  deposit: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function AdminDresses() {
  const { locale } = useLang();
  const { push } = useToast();
  const [list, setList] = useState<Dress[]>([]);
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, reset, watch } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { category_slug: 'wedding', sale_enabled: true, rental_enabled: true },
  });

  const load = async () => {
    if (isDemoMode()) {
      // Sample inventory, local only.
      setList(demoStore.listDresses());
      return;
    }
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.from('dresses').select('*, images:dress_images(*)').order('created_at', { ascending: false }).limit(100);
    setList((data ?? []) as Dress[]);
  };
  useEffect(() => { void load(); }, []);

  const create = async (f: Form) => {
    const toMinor = (s?: string) => (s && s.trim() ? Math.round(parseFloat(s) * 100) : null);
    if (isDemoMode()) {
      // Local sample record only — never touches the database.
      demoStore.saveDress({
        id: `demo-${Date.now()}`, code: f.code.trim(),
        name_ar: f.name_ar, name_en: f.name_en,
        category_slug: f.category_slug,
        sale_enabled: f.sale_enabled, sale_price_minor: f.sale_enabled ? toMinor(f.sale_price) : null,
        rental_enabled: f.rental_enabled, rental_price_minor: f.rental_enabled ? toMinor(f.rental_price) : null,
        deposit_minor: toMinor(f.deposit), booking_deposit_minor: null,
        sizes: ['S', 'M', 'L'], colors: ['Ivory'],
        is_featured: false, is_new: true, is_active: true, is_sold: false,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        images: [], demoSample: true,
      });
      push('success', `${t(locale, 'demo_sample')} — ${locale === 'ar' ? 'تمت الإضافة محلياً' : 'added locally'}`);
      reset(); void load();
      return;
    }
    if (!isSupabaseConfigured) { push('info', locale === 'ar' ? 'اربطي Supabase أولاً (README).' : 'Connect Supabase first (README).'); return; }
    const { data, error } = await supabase.from('dresses').insert({
      code: f.code.trim(),
      name_ar: f.name_ar, name_en: f.name_en,
      category_slug: f.category_slug,
      sale_enabled: f.sale_enabled, sale_price_minor: f.sale_enabled ? toMinor(f.sale_price) : null,
      rental_enabled: f.rental_enabled, rental_price_minor: f.rental_enabled ? toMinor(f.rental_price) : null,
      deposit_minor: toMinor(f.deposit),
      sizes: ['S', 'M', 'L'], colors: ['Ivory'],
      is_active: true,
    }).select('id').single();
    if (error || !data) { push('error', error?.message ?? 'failed'); return; }
    push('success', locale === 'ar' ? 'تم إنشاء الفستان' : 'Dress created');
    reset(); void load();
  };

  const uploadImage = async (dressId: string, file: File) => {
    if (isDemoMode()) {
      // Storage writes are disabled in demo mode entirely.
      push('info', `${t(locale, 'demo_sample')} — ${locale === 'ar' ? 'رفع الصور معطّل في العرض التجريبي' : 'uploads disabled in demo'}`);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      push('error', locale === 'ar' ? 'نوع أو حجم الصورة غير مسموح (حتى 5MB: jpg/png/webp)' : 'Invalid image (max 5MB jpg/png/webp)');
      return;
    }
    setUploading(true);
    try {
      const path = `${dressId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('dress-images').upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('dress-images').getPublicUrl(path);
      const { error: dbErr } = await supabase.from('dress_images').insert({ dress_id: dressId, url: pub.publicUrl, is_primary: true, sort: 0 });
      if (dbErr) throw dbErr;
      push('success', locale === 'ar' ? 'تم رفع الصورة' : 'Image uploaded');
      void load();
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'upload failed');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (d: Dress) => {
    if (!confirm(locale === 'ar' ? 'تأكيد تغيير الحالة؟' : 'Confirm status change?')) return;
    if (isDemoMode()) {
      demoStore.updateDress(d.id, { is_active: !d.is_active });
      void load();
      return;
    }
    const { error } = await supabase.from('dresses').update({ is_active: !d.is_active }).eq('id', d.id);
    if (error) push('error', error.message); else void load();
  };

  return (
    <div>
      <h1 className="font-heading text-3xl mb-4">{locale === 'ar' ? 'إدارة الفساتين' : 'Dress Management'}</h1>
      {isDemoMode() && <p className="text-xs bg-gold/15 border border-gold/40 rounded-xl p-3 mb-4">{t(locale, 'demo_banner')}</p>}
      <form onSubmit={handleSubmit(create)} className="bg-white border border-champagne rounded-3xl p-5 grid sm:grid-cols-3 gap-3 mb-6">
        <label className="text-sm" dir="ltr">Code*<input {...register('code')} placeholder="AG-W-010" className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm">الاسم (عربي)*<input {...register('name_ar')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm" dir="ltr">Name (EN)*<input {...register('name_en')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm">الفئة<select {...register('category_slug')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2"><option value="wedding">wedding</option><option value="engagement">engagement</option></select></label>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" {...register('sale_enabled')} defaultChecked /> {locale === 'ar' ? 'بيع' : 'Sale'}<input {...register('sale_price')} placeholder="45000" dir="ltr" className="w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" {...register('rental_enabled')} defaultChecked /> {locale === 'ar' ? 'تأجير' : 'Rental'}<input {...register('rental_price')} placeholder="9000" dir="ltr" className="w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <div className="sm:col-span-3"><button className="bg-cocoa text-ivory rounded-full px-6 py-2.5 text-sm">{locale === 'ar' ? 'إنشاء فستان' : 'Create dress'}</button></div>
      </form>

      <div className="space-y-2">
        {list.map((d) => (
          <div key={d.id} className="bg-white border border-champagne rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[180px]">
              <p className="font-medium">{locale === 'ar' ? d.name_ar : d.name_en} <span className="text-xs text-stone-soft" dir="ltr">{d.code}</span>{d.demoSample && <span className="ms-2 text-[10px] bg-gold-deep text-white px-2 py-0.5 rounded-full">{t(locale, 'demo_sample')}</span>}</p>
              <p className="text-xs text-stone-soft">{d.sale_enabled ? formatMoney(d.sale_price_minor, 'EGP', locale) : '—'} · {d.rental_enabled ? formatMoney(d.rental_price_minor, 'EGP', locale) : '—'} · {(d.images?.length ?? 0)} imgs · {d.is_active ? (locale === 'ar' ? 'نشط' : 'active') : (locale === 'ar' ? 'مؤرشف' : 'archived')}</p>
            </div>
            <label className="text-xs border border-champagne rounded-full px-3 py-1.5 cursor-pointer">
              {uploading ? '…' : (locale === 'ar' ? 'رفع صورة' : 'Upload')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(d.id, f); }} />
            </label>
            <button onClick={() => void toggleActive(d)} className="text-xs border border-champagne rounded-full px-3 py-1.5">{d.is_active ? (locale === 'ar' ? 'أرشفة' : 'Archive') : (locale === 'ar' ? 'تفعيل' : 'Activate')}</button>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-stone-soft">{locale === 'ar' ? 'لا توجد بيانات بعد — اربطي Supabase وأضيفي أول فستان.' : 'No data yet — connect Supabase and add your first dress.'}</p>}
      </div>
      <p className="text-xs text-stone-soft mt-3">watch: {JSON.stringify(watch('code') ?? '')}</p>
    </div>
  );
}
