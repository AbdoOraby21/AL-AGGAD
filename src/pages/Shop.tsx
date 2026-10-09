import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useLang } from '../app/LanguageContext';
import { t } from '../lib/i18n';
import { formatMoney } from '../lib/money';
import { useCart } from '../app/CartContext';
import { useToast } from '../app/ToastContext';
import { submitSalesOrder } from '../lib/transactions';
import { isDemoMode } from '../lib/demo';

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  fulfillment: z.enum(['store_pickup', 'cod', 'online']),
  notes: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function Cart() {
  const { locale } = useLang();
  const { items, remove, total } = useCart();
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-heading text-3xl mb-6">{t(locale, 'cart')}</h1>
      {items.length === 0 ? (
        <p className="bg-white border border-champagne rounded-2xl p-8 text-center text-stone-soft">
          {locale === 'ar' ? 'سلتك فارغة. ' : 'Your bag is empty. '}<Link to="/catalog" className="underline">{t(locale, 'catalog')}</Link>
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <div key={`${i.dressId}|${i.size}|${i.color}`} className="bg-white border border-champagne rounded-2xl p-4 flex gap-4 items-center">
              {i.image && <img src={i.image} alt="" className="w-16 h-20 object-cover rounded-xl" />}
              <div className="flex-1">
                <p className="font-medium">{locale === 'ar' ? i.nameAr : i.nameEn}</p>
                <p className="text-xs text-stone-soft" dir="ltr">{i.code} · {i.size} · {i.color}</p>
                <p className="text-sm font-semibold mt-1">{formatMoney(i.priceMinor * i.qty, 'EGP', locale)}</p>
              </div>
              <button onClick={() => remove(i.dressId, i.size, i.color)} className="text-sm underline text-stone-soft">✕</button>
            </div>
          ))}
          <div className="flex items-center justify-between bg-cocoa text-ivory rounded-2xl px-5 py-4">
            <span>{t(locale, 'total')}</span><strong>{formatMoney(total, 'EGP', locale)}</strong>
          </div>
          <Link to="/checkout" className="block text-center bg-gold text-white rounded-full py-3 hover:bg-gold-deep">{t(locale, 'checkout')}</Link>
        </div>
      )}
    </main>
  );
}

export function Checkout() {
  const { locale } = useLang();
  const { items, total, clear } = useCart();
  const { push } = useToast();
  const [ref, setRef] = useState<string | null>(null);
  const [wasDemo, setWasDemo] = useState(false);
  const { register, handleSubmit } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { fulfillment: 'store_pickup' } });

  const onSubmit = async (f: Form) => {
    try {
      const { reference, demo } = await submitSalesOrder({
        name: f.name,
        phone: f.phone,
        fulfillment: f.fulfillment,
        notes: f.notes,
        totalMinor: total,
        currency: 'EGP',
        items: items.map((i) => ({
          dressId: i.dressId, code: i.code,
          name: locale === 'ar' ? i.nameAr : i.nameEn,
          size: i.size, color: i.color,
          priceMinor: i.priceMinor, qty: i.qty,
        })),
      });
      setRef(reference);
      setWasDemo(demo);
      clear();
      push('success', `${t(locale, 'order_success')} ${reference}`);
    } catch (e) {
      push('error', e instanceof Error ? e.message : t(locale, 'error_generic'));
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-heading text-3xl mb-6">{t(locale, 'checkout')}</h1>
      {ref ? (
        <div className="bg-white border border-champagne rounded-3xl p-8 text-center">
          <p className="font-wordmark text-3xl text-gold-deep">مبارك 🤍</p>
          <p className="mt-2">{t(locale, 'order_success')}</p>
          <p className="text-xl font-bold mt-1" dir="ltr">{ref}</p>
          {(wasDemo || isDemoMode()) && (
            <p className="mt-3 text-xs bg-gold/15 border border-gold/40 rounded-xl p-3">{t(locale, 'demo_order_note')}</p>
          )}
          <Link to="/catalog" className="underline text-sm">{t(locale, 'catalog')}</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-champagne rounded-3xl p-6 space-y-4">
          <label className="block text-sm">{t(locale, 'name')}<input {...register('name')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
          <label className="block text-sm" dir="ltr">{t(locale, 'phone')}<input {...register('phone')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
          <label className="block text-sm">{locale === 'ar' ? 'طريقة الاستلام' : 'Fulfillment'}
            <select {...register('fulfillment')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2">
              <option value="store_pickup">{locale === 'ar' ? 'الاستلام من البوتيك / الدفع في المتجر' : 'Store pickup / pay at store'}</option>
              <option value="cod">{locale === 'ar' ? 'الدفع عند الاستلام' : 'Cash on delivery'}</option>
              <option value="online">{locale === 'ar' ? 'دفع إلكتروني (بعد التفعيل)' : 'Online payment (after activation)'}</option>
            </select>
          </label>
          <p className="text-sm flex justify-between"><span>{t(locale, 'total')}</span><strong>{formatMoney(total, 'EGP', locale)}</strong></p>
          <button className="w-full bg-cocoa text-ivory rounded-full py-3 hover:bg-gold-deep">{t(locale, 'submit_order')}</button>
        </form>
      )}
    </main>
  );
}
