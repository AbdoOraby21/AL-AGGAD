import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Dress } from '../lib/types';
import { dressName } from '../lib/i18n';
import { isDemoMode } from '../lib/demo';
import { useLang } from '../app/LanguageContext';
import { formatMoney } from '../lib/money';
import { primaryImage } from '../app/useDresses';
import { t } from '../lib/i18n';

export function DressCard({ dress, fav, onFav }: { dress: Dress; fav?: boolean; onFav?: (id: string) => void }) {
  const { locale } = useLang();
  const sample = dress.demoSample || isDemoMode();
  return (
    <article className="card-lux bg-white rounded-2xl overflow-hidden border border-champagne shadow-[0_8px_30px_rgba(48,37,31,0.06)]">
      <div className="relative img-zoom overflow-hidden aspect-[3/4]">
        <Link to={`/dress/${dress.code}`} aria-label={dressName(dress, locale)}>
          <img src={primaryImage(dress)} alt={dressName(dress, locale)} loading="lazy" className="w-full h-full object-cover" />
        </Link>
        <div className="absolute top-3 start-3 flex gap-2">
          {sample && <span className="text-[11px] bg-gold-deep text-white px-2.5 py-1 rounded-full" title="demo">{t(locale, 'demo_sample')}</span>}
          {dress.is_new && <span className="text-[11px] bg-cocoa text-ivory px-2.5 py-1 rounded-full">{locale === 'ar' ? 'جديد' : 'New'}</span>}
          {dress.rental_enabled && <span className="text-[11px] bg-gold text-white px-2.5 py-1 rounded-full">{t(locale, 'rent')}</span>}
        </div>
        {onFav && (
          <button onClick={() => onFav(dress.id)} aria-label="favorite" className={`absolute top-3 end-3 p-2 rounded-full ${fav ? 'bg-cocoa text-ivory' : 'bg-white/85 text-cocoa'}`}>
            <Heart size={15} fill={fav ? 'currentColor' : 'none'} />
          </button>
        )}
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
        </div>
      </div>
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
