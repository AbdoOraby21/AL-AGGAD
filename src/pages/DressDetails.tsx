import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, MessageCircle, ShoppingBag } from 'lucide-react';
import { useLang } from '../app/LanguageContext';
import { dressName, t } from '../lib/i18n';
import { formatMoney } from '../lib/money';
import { useDresses, primaryImage } from '../app/useDresses';
import { useCart } from '../app/CartContext';
import { useToast } from '../app/ToastContext';
import { submitRentalBooking } from '../lib/transactions';
import { isDemoMode } from '../lib/demo';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { DressCard } from '../components/DressCard';

const bookingSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  occasion_date: z.string().optional(),
  start_date: z.string().min(1, 'required'),
  end_date: z.string().min(1, 'required'),
  size: z.string().optional(),
  color: z.string().optional(),
});
type BookingForm = z.infer<typeof bookingSchema>;

export function DressDetails() {
  const { code } = useParams();
  const { locale } = useLang();
  const { dresses } = useDresses();
  const { add } = useCart();
  const { push } = useToast();
  const dress = useMemo(() => dresses.find((d) => d.code === code), [dresses, code]);
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [fav, setFav] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [wasDemo, setWasDemo] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BookingForm>({ resolver: zodResolver(bookingSchema) });

  if (!dress) return <main className="max-w-4xl mx-auto px-4 py-16 text-center text-stone-soft">{t(locale, 'loading')}</main>;

  const images = dress.images?.length ? dress.images : [{ id: 'x', dress_id: dress.id, url: primaryImage(dress), sort: 0, is_primary: true }];
  const WA = import.meta.env.VITE_WHATSAPP_NUMBER ?? '201000000000';

  const toggleFav = () => {
    setFav(!fav);
    try {
      const raw = JSON.parse(localStorage.getItem('aggad-favs') ?? '[]') as string[];
      const next = fav ? raw.filter((x) => x !== dress.id) : [...raw, dress.id];
      localStorage.setItem('aggad-favs', JSON.stringify(next));
    } catch { /* noop */ }
  };

  const buyNow = () => {
    if (!dress.sale_enabled) { push('error', t(locale, 'unavailable')); return; }
    add({ dressId: dress.id, code: dress.code, nameAr: dress.name_ar, nameEn: dress.name_en, image: primaryImage(dress), size: size || undefined, color: color || undefined, priceMinor: dress.sale_price_minor ?? 0, qty: 1 });
    push('success', locale === 'ar' ? 'تمت الإضافة إلى السلة' : 'Added to bag');
  };

  const onBooking = async (f: BookingForm) => {
    if (!dress.rental_enabled) { push('error', t(locale, 'unavailable')); return; }
    if (f.start_date > f.end_date) { push('error', locale === 'ar' ? 'تاريخ الإرجاع يجب أن يكون بعد الاستلام' : 'Return must be after pickup'); return; }
    try {
      const { reference, demo } = await submitRentalBooking({
        dressId: dress.id,
        dressCode: dress.code,
        name: f.name,
        phone: f.phone,
        occasionDate: f.occasion_date,
        startDate: f.start_date,
        endDate: f.end_date,
        size: f.size || size || undefined,
        color: f.color || color || undefined,
        rentalFeeMinor: dress.rental_price_minor ?? 0,
        bookingDepositMinor: dress.booking_deposit_minor ?? 0,
        securityDepositMinor: dress.deposit_minor ?? 0,
        currency: 'EGP',
      });
      setBookingRef(reference);
      setWasDemo(demo);
      push('success', `${t(locale, 'booking_success')} ${reference}`);
    } catch (e) {
      push('error', e instanceof Error ? e.message : t(locale, 'error_generic'));
    }
  };

  const related = dresses.filter((d) => d.id !== dress.id && d.category_slug === dress.category_slug).slice(0, 4);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="rounded-3xl overflow-hidden border border-champagne bg-white">
            <img src={images[Math.min(imgIdx, images.length - 1)].url} alt={dressName(dress, locale)} className="w-full aspect-[3/4] object-cover" />
          </div>
          <div className="mt-3 flex gap-2">
            {images.map((im, i) => (
              <button key={im.id + i} onClick={() => setImgIdx(i)} className={`rounded-xl overflow-hidden border-2 ${i === imgIdx ? 'border-gold' : 'border-transparent'}`} aria-label={`thumb ${i + 1}`}>
                <img src={im.url} alt="" className="w-16 h-20 object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs tracking-widest text-stone-soft" dir="ltr">{dress.code}</p>
          <h1 className="text-3xl md:text-4xl font-heading text-cocoa mt-1">{dressName(dress, locale)}</h1>
          <p className="text-stone-soft mt-3 leading-7">{locale === 'ar' ? dress.description_ar : dress.description_en}</p>
          {(dress.fabric || dress.style) && (
            <p className="mt-2 text-sm text-stone-soft">{[dress.style, dress.fabric].filter(Boolean).join(' · ')}</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            {dress.sale_enabled && (
              <div className="bg-white border border-champagne rounded-2xl p-4">
                <p className="text-xs text-stone-soft">{t(locale, 'sale_price')}</p>
                <p className="text-xl font-semibold">{formatMoney(dress.sale_price_minor, 'EGP', locale)}</p>
              </div>
            )}
            {dress.rental_enabled && (
              <div className="bg-white border border-champagne rounded-2xl p-4">
                <p className="text-xs text-stone-soft">{t(locale, 'rental_price')}</p>
                <p className="text-xl font-semibold">{formatMoney(dress.rental_price_minor, 'EGP', locale)}</p>
                {dress.deposit_minor != null && <p className="text-xs text-stone-soft mt-1">{t(locale, 'deposit')}: {formatMoney(dress.deposit_minor, 'EGP', locale)}</p>}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3 flex-wrap">
            {dress.sizes.length > 0 && (
              <label className="text-sm">{t(locale, 'size')}:{' '}
                <select value={size} onChange={(e) => setSize(e.target.value)} className="border border-champagne rounded-full px-3 py-1.5 bg-white">
                  <option value="">—</option>{dress.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            )}
            {dress.colors.length > 0 && (
              <label className="text-sm">{t(locale, 'color')}:{' '}
                <select value={color} onChange={(e) => setColor(e.target.value)} className="border border-champagne rounded-full px-3 py-1.5 bg-white">
                  <option value="">—</option>{dress.colors.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            )}
            <button onClick={toggleFav} className={`flex items-center gap-1 text-sm border rounded-full px-4 py-2 ${fav ? 'bg-cocoa text-ivory border-cocoa' : 'border-champagne bg-white'}`}>
              <Heart size={15} fill={fav ? 'currentColor' : 'none'} /> {locale === 'ar' ? 'مفضلتي' : 'Favorite'}
            </button>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            {dress.sale_enabled && (
              <button onClick={buyNow} className="btn-lux flex-1 flex items-center justify-center gap-2 bg-cocoa text-ivory rounded-full px-6 py-3 hover:bg-gold-deep">
                <ShoppingBag size={17} /> {t(locale, 'buy_this')}
              </button>
            )}
            <WhatsAppButton
              payload={{ to: WA, productName: dressName(dress, locale), productCode: dress.code, intent: dress.rental_enabled ? 'rental' : 'sale', size: size || undefined, color: color || undefined, pageUrl: typeof window !== 'undefined' ? window.location.href : undefined, lang: locale }}
              className="btn-lux flex-1 flex items-center justify-center gap-2 border border-green-700/30 bg-[#25D366]/10 rounded-full px-6 py-3 hover:bg-[#25D366]/20"
            >
              <MessageCircle size={17} /> {t(locale, 'whatsapp_inquire')}
            </WhatsAppButton>
          </div>

          {dress.rental_enabled && (
            <form onSubmit={handleSubmit(onBooking)} className="mt-6 bg-white border border-champagne rounded-3xl p-6 space-y-3">
              <h2 className="font-heading text-2xl">{t(locale, 'rent_this')}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-sm">{t(locale, 'name')}<input {...register('name')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" />{errors.name && <span className="text-red-700 text-xs">!</span>}</label>
                <label className="text-sm" dir="ltr">{t(locale, 'phone')}<input {...register('phone')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
                <label className="text-sm">{t(locale, 'occasion_date')}<input type="date" {...register('occasion_date')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
                <span />
                <label className="text-sm">{t(locale, 'start_date')}<input type="date" {...register('start_date')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" />{errors.start_date && <span className="text-red-700 text-xs">!</span>}</label>
                <label className="text-sm">{t(locale, 'end_date')}<input type="date" {...register('end_date')} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" />{errors.end_date && <span className="text-red-700 text-xs">!</span>}</label>
              </div>
              <button disabled={isSubmitting} className="btn-lux w-full bg-gold text-white rounded-full py-3 hover:bg-gold-deep disabled:opacity-50">
                {isSubmitting ? t(locale, 'loading') : t(locale, 'submit_booking')}
              </button>
              {bookingRef && (
                <div className="text-sm bg-ivory border border-champagne rounded-xl p-3 space-y-2">
                  <p>{t(locale, 'booking_success')} <strong dir="ltr">{bookingRef}</strong></p>
                  {(wasDemo || isDemoMode()) && (
                    <p className="text-xs bg-gold/15 border border-gold/40 rounded-lg p-2">{t(locale, 'demo_booking_note')}</p>
                  )}
                  <WhatsAppButton
                    payload={{ to: WA, productName: dressName(dress, locale), productCode: dress.code, intent: 'rental', size: size || undefined, color: color || undefined, bookingRef, lang: locale }}
                  >
                    <span className="underline">{locale === 'ar' ? 'تأكيد عبر واتساب' : 'Confirm via WhatsApp'}</span>
                  </WhatsAppButton>
                </div>
              )}
              <p className="text-xs text-stone-soft">{locale === 'ar' ? 'إرسال الطلب لا يعني التأكيد — تراجع الإدارة التوفر وتؤكد الحجز.' : 'Submitting is not confirmation — our team verifies availability and confirms.'}</p>
            </form>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="pt-14">
          <h2 className="font-heading text-2xl mb-4">{locale === 'ar' ? 'فساتين مشابهة' : 'You may also love'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{related.map((d) => <DressCard key={d.id} dress={d} />)}</div>
        </section>
      )}
      <p className="mt-8 text-sm"><Link to="/catalog" className="underline">← {t(locale, 'catalog')}</Link></p>
    </main>
  );
}
