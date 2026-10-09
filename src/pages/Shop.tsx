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
import { usePageMeta } from '../lib/meta';

const schema = z.object({
  name: z.string().min(2, 'required'),
  phone: z.string().min(8, 'required'),
  fulfillment: z.enum(['store_pickup', 'cod', 'online']),
  notes: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function Cart() {
  const { locale } = useLang();
  const { items, remove, setQty, total, promoCode, promoPct, discountedTotal, applyPromo } = useCart();
  const [code, setCode] = useState('');
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  usePageMeta(t(locale, 'cart'));
  const tryPromo = () => {
    const ok = applyPromo(code);
    setPromoMsg(ok ? t(locale, 'promo_applied') : t(locale, 'promo_invalid'));
  };
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
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => setQty(i.dressId, i.size, i.color, i.qty - 1)} className="w-7 h-7 rounded-full border border-champagne" aria-label="decrease">−</button>
                  <span className="text-sm w-6 text-center" dir="ltr">{i.qty}</span>
                  <button onClick={() => setQty(i.dressId, i.size, i.color, i.qty + 1)} className="w-7 h-7 rounded-full border border-champagne" aria-label="increase">+</button>
                </div>
                <p className="text-sm font-semibold mt-1">{formatMoney(i.priceMinor * i.qty, 'EGP', locale)}</p>
              </div>
              <button onClick={() => remove(i.dressId, i.size, i.color)} className="text-sm underline text-stone-soft">{t(locale, 'remove')}</button>
            </div>
          ))}
          <div className="bg-white border border-champagne rounded-2xl p-4 flex flex-col sm:flex-row gap-2 sm:items-center">
            <label className="flex-1 flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t(locale, 'promo_code')}
                className="flex-1 border border-champagne rounded-full px-4 py-2 text-sm uppercase" dir="ltr" />
              <button onClick={tryPromo} className="border border-cocoa rounded-full px-5 py-2 text-sm">{t(locale, 'apply')}</button>
            </label>
            {promoMsg && <p className="text-xs text-stone-soft">{promoMsg}{promoCode ? ` (${promoCode} −${promoPct}%)` : ''}</p>}
          </div>
          <div className="bg-cocoa text-ivory rounded-2xl px-5 py-4 space-y-1 text-sm">
            <p className="flex justify-between"><span>{t(locale, 'total')}</span><span>{formatMoney(total, 'EGP', locale)}</span></p>
            {promoPct > 0 && <p className="flex justify-between text-champagne"><span>{t(locale, 'promo_code')} {promoCode}</span><strong>{formatMoney(discountedTotal, 'EGP', locale)}</strong></p>}
          </div>
          <Link to="/checkout" className="block text-center bg-gold text-white rounded-full py-3 hover:bg-gold-deep">{t(locale, 'checkout')}</Link>
        </div>
      )}
    </main>
  );
}

export function Checkout() {
  const { locale } = useLang();
  const { items, total, discountedTotal, promoCode, promoPct, clear } = useCart();
  const { push } = useToast();
  const [ref, setRef] = useState<string | null>(null);
  const [wasDemo, setWasDemo] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { fulfillment: 'store_pickup' } });
  usePageMeta(t(locale, 'checkout'));

  const payable = promoPct > 0 ? discountedTotal : total;
  const onSubmit = async (f: Form) => {
    try {
      const { reference, demo } = await submitSalesOrder({
        name: f.name,
        phone: f.phone,
        fulfillment: f.fulfillment,
        notes: f.notes,
        totalMinor: payable,
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

  if (items.length === 0 && !ref) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10 text-center text-stone-soft">
        <p>{locale === 'ar' ? 'سلتك فارغة.' : 'Your bag is empty.'} <Link to="/catalog" className="underline">{t(locale, 'catalog')}</Link></p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-heading text-3xl mb-6">{t(locale, 'checkout')}</h1>
      {isDemoMode() && <p className="text-xs bg-gold/15 border border-gold/40 rounded-xl p-3 mb-4">{t(locale, 'demo_order_note')} {t(locale, 'demo_local_note')}</p>}
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
          <div className="bg-ivory border border-champagne rounded-2xl p-4 text-sm space-y-1">
            {items.map((i) => (
              <p key={`${i.dressId}|${i.size}|${i.color}`} className="flex justify-between">
                <span>{locale === 'ar' ? i.nameAr : i.nameEn} <span dir="ltr" className="text-stone-soft">×{i.qty}</span></span>
                <span>{formatMoney(i.priceMinor * i.qty, 'EGP', locale)}</span>
              </p>
            ))}
            {promoPct > 0 && <p className="flex justify-between text-gold-deep"><span>{t(locale, 'promo_code')} {promoCode} (−{promoPct}%)</span><span>{formatMoney(payable, 'EGP', locale)}</span></p>}
          </div>
          <label className="block text-sm">{t(locale, 'name')}*
            <input {...register('name')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" />
            {errors.name && <span className="text-red-700 text-xs">{t(locale, 'required_field')}</span>}
          </label>
          <label className="block text-sm" dir="ltr">{t(locale, 'phone')}*
            <input {...register('phone')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" />
            {errors.phone && <span className="text-red-700 text-xs">{t(locale, 'required_field')}</span>}
          </label>
          <label className="block text-sm">{locale === 'ar' ? 'طريقة الاستلام' : 'Fulfillment'}
            <select {...register('fulfillment')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2">
              <option value="store_pickup">{locale === 'ar' ? 'الاستلام من البوتيك / الدفع في المتجر' : 'Store pickup / pay at store'}</option>
              <option value="cod">{locale === 'ar' ? 'الدفع عند الاستلام' : 'Cash on delivery'}</option>
              <option value="online">{locale === 'ar' ? 'دفع إلكتروني (بعد التفعيل)' : 'Online payment (after activation)'}</option>
            </select>
          </label>
          <p className="text-sm flex justify-between"><span>{t(locale, 'total')}</span><strong>{formatMoney(payable, 'EGP', locale)}</strong></p>
          <button className="w-full bg-cocoa text-ivory rounded-full py-3 hover:bg-gold-deep">
            {isDemoMode() ? t(locale, 'submit_demo_request') : t(locale, 'submit_order')}
          </button>
        </form>
      )}
    </main>
  );
}
