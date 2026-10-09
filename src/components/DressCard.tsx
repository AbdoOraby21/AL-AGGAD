import { Link } from 'react-router-dom';
import { Eye, Heart, X } from 'lucide-react';
import { useState } from 'react';
import type { Dress } from '../lib/types';
import { dressName } from '../lib/i18n';
import { isDemoMode } from '../lib/demo';
import { useLang } from '../app/LanguageContext';
import { formatMoney } from '../lib/money';
import { primaryImage } from '../app/useDresses';
import { isFav, toggleFavId } from '../lib/favorites';
import { FALLBACK_DRESS_IMAGE } from '../lib/catalog';
import { t } from '../lib/i18n';

function QuickView({ dress, onClose }: { dress: Dress; onClose: () => void }) {
  const { locale } = useLang();
  const [fav, setFav] = useState(isFav(dress.id));
  return (
    <div role="dialog" aria-modal="true" aria-label={dressName(dress, locale)}
      className="fixed inset-0 z-50 grid place-items-center bg-cocoa/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-ivory rounded-3xl overflow-hidden grid sm:grid-cols-2" onClick={(e) => e.stopPropagation()}>
        <img src={primaryImage(dress)} onError={(e) => { e.currentTarget.src = FALLBACK_DRESS_IMAGE; }}
          alt={dressName(dress, locale)} className="w-full h-64 sm:h-full object-cover" />
        <div className="p-6 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] tracking-widest text-stone-soft" dir="ltr">{dress.code}</p>
              <h3 className="font-heading text-2xl text-cocoa">{dressName(dress, locale)}</h3>
            </div>
            <button onClick={onClose} aria-label={t(locale, 'demo_close')} className="p-1.5 rounded-full hover:bg-champagne/60"><X size={16} /></button>
          </div>
          <p className="text-sm text-stone-soft mt-2 line-clamp-3">{locale === 'ar' ? dress.description_ar : dress.description_en}</p>
          <div className="mt-3 text-sm space-y-1">
            {dress.sale_enabled && <p className="flex justify-between"><span>{t(locale, 'sale_price')}</span><strong>{formatMoney(dress.sale_price_minor, 'EGP', locale)}</strong></p>}
            {dress.rental_enabled && <p className="flex justify-between"><span>{t(locale, 'rental_price')}</span><strong>{formatMoney(dress.rental_price_minor, 'EGP', locale)}</strong></p>}
            <p className="flex justify-between text-stone-soft text-xs"><span>{t(locale, 'size')}</span><span dir="ltr">{dress.sizes.join(', ') || '—'}</span></p>
          </div>
          <div className="mt-auto pt-4 flex gap-2">
            <Link to={`/dress/${dress.code}`} className="flex-1 text-center bg-cocoa text-ivory rounded-full py-2.5 text-sm">
              {locale === 'ar' ? 'التفاصيل' : 'Details'}
            </Link>
            <button onClick={() => setFav(toggleFavId(dress.id))} aria-label="favorite"
              className={`p-2.5 rounded-full border ${fav ? 'bg-cocoa text-ivory border-cocoa' : 'border-champagne bg-white'}`}>
              <Heart size={15} fill={fav ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DressCard({ dress }: { dress: Dress }) {
  const { locale } = useLang();
  const [fav, setFav] = useState(isFav(dress.id));
  const [preview, setPreview] = useState(false);
  const sample = dress.demoSample || isDemoMode();
  return (
    <article className="card-lux bg-white rounded-2xl overflow-hidden border border-champagne shadow-[0_8px_30px_rgba(48,37,31,0.06)]">
      <div className="relative img-zoom overflow-hidden aspect-[3/4]">
        <Link to={`/dress/${dress.code}`} aria-label={dressName(dress, locale)}>
          <img src={primaryImage(dress)} onError={(e) => { e.currentTarget.src = FALLBACK_DRESS_IMAGE; }}
            alt={dressName(dress, locale)} loading="lazy" className="w-full h-full object-cover" />
        </Link>
        <div className="absolute top-3 start-3 flex gap-2">
          {sample && <span className="text-[11px] bg-gold-deep text-white px-2.5 py-1 rounded-full" title="demo">{t(locale, 'demo_sample')}</span>}
          {dress.is_new && <span className="text-[11px] bg-cocoa text-ivory px-2.5 py-1 rounded-full">{locale === 'ar' ? 'جديد' : 'New'}</span>}
          {dress.rental_enabled && <span className="text-[11px] bg-gold text-white px-2.5 py-1 rounded-full">{t(locale, 'rent')}</span>}
        </div>
        <div className="absolute top-3 end-3 flex flex-col gap-2">
          <button onClick={() => setFav(toggleFavId(dress.id))} aria-label="favorite"
            className={`p-2 rounded-full ${fav ? 'bg-cocoa text-ivory' : 'bg-white/85 text-cocoa'}`}>
            <Heart size={15} fill={fav ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => setPreview(true)} aria-label="quick view"
            className="p-2 rounded-full bg-white/85 text-cocoa">
            <Eye size={15} />
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-[11px] tracking-widest text-stone-soft" dir="ltr">{dress.code}</p>
        <Link to={`/dress/${dress.code}`} className="font-medium text-cocoa hover:text-gold-deep line-clamp-1">
          {dressName(dress, locale)}
        </Link>
        <div className="mt-2 flex items-center justify-between text-sm">
          {dress.sale_enabled && dress.sale_price_minor != null
            ? <span className="font-semibold">{formatMoney(dress.sale_price_minor, 'EGP', locale)}</span>
            : dress.rental_enabled
              ? <span className="font-semibold">{formatMoney(dress.rental_price_minor, 'EGP', locale)} <span className="font-normal text-stone-soft text-xs">/ {t(locale, 'rent')}</span></span>
              : <span className="text-stone-soft text-xs">{t(locale, 'unavailable')}</span>}
          <Link to={`/dress/${dress.code}`} className="text-xs underline text-stone-soft">
            {locale === 'ar' ? 'التفاصيل' : 'Details'}
          </Link>
        </div>
        {dress.rental_enabled && dress.rental_price_minor != null && dress.sale_enabled && (
          <p className="text-[11px] text-stone-soft mt-1">{t(locale, 'rental_price')}: {formatMoney(dress.rental_price_minor, 'EGP', locale)}</p>
        )}
      </div>
      {preview && <QuickView dress={dress} onClose={() => setPreview(false)} />}
    </article>
  );
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center mb-8">
      <span className="mx-auto flex items-center gap-2 text-gold" aria-hidden="true">
        <span className="h-px w-8 bg-gold/60" />
        <span className="inline-block w-1.5 h-1.5 rotate-45 bg-gold/80" />
        <span className="h-px w-8 bg-gold/60" />
      </span>
      <h2 className="font-heading text-3xl md:text-4xl text-cocoa">{title}</h2>
      {sub && <p className="text-stone-soft mt-2">{sub}</p>}
      <div className="mx-auto mt-4 h-px w-24 bg-gold/60" />
    </div>
  );
}

export function Empty({ message }: { message: string }) {
  return <div className="text-center py-16 text-stone-soft bg-white/60 border border-dashed border-champagne rounded-2xl">{message}</div>;
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-2xl overflow-hidden border border-champagne">
          <div className="aspect-[3/4] bg-champagne/50" />
          <div className="p-4 space-y-2"><div className="h-3 bg-champagne/60 rounded" /><div className="h-3 w-2/3 bg-champagne/60 rounded" /></div>
        </div>
      ))}
    </div>
  );
}
