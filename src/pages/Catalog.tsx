import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLang } from '../app/LanguageContext';
import { t } from '../lib/i18n';
import { formatMoney } from '../lib/money';
import { useDresses } from '../app/useDresses';
import { DressCard, Empty, SectionTitle, SkeletonGrid } from '../components/DressCard';
import { availableColors, availableSizes, availableStyles, filterDresses, maxCatalogPrice } from '../lib/catalog';
import { usePageMeta } from '../lib/meta';
import type { ModeFilter } from '../lib/types';

export function Catalog() {
  const { locale } = useLang();
  const [params, setParams] = useSearchParams();
  const { dresses, loading } = useDresses();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [sort, setSort] = useState('newest');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [style, setStyle] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  usePageMeta(t(locale, 'catalog'), locale === 'ar' ? 'تشكيلة فساتين الزفاف والخطوبة — بيع وتأجير' : 'Wedding & engagement dress collection — sale and rental');

  const category = params.get('category') ?? 'all';
  const mode: ModeFilter = (params.get('mode') as ModeFilter) || 'all';

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (!v || v === 'all') next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };
  const clearAll = () => {
    setParams({}, { replace: true });
    setQ(''); setSort('newest'); setSize(''); setColor(''); setStyle(''); setMaxPrice(null);
  };

  const sizes = useMemo(() => availableSizes(dresses), [dresses]);
  const colors = useMemo(() => availableColors(dresses), [dresses]);
  const styles = useMemo(() => availableStyles(dresses), [dresses]);
  const ceiling = useMemo(() => maxCatalogPrice(dresses), [dresses]);

  const list = useMemo(
    () => filterDresses(dresses, { category, mode, q, sort, maxPriceMinor: maxPrice, size: size || undefined, color: color || undefined, style: style || undefined }),
    [dresses, category, mode, q, sort, maxPrice, size, color, style],
  );
  const activeCount = [category !== 'all', mode !== 'all', q.trim() !== '', size, color, style, maxPrice != null].filter(Boolean).length;

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <SectionTitle title={t(locale, 'catalog')} sub={locale === 'ar' ? `${list.length} فستان` : `${list.length} dresses`} />
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={t(locale, 'search_placeholder')}
            className="flex-1 border border-champagne bg-white rounded-full px-5 py-2.5 focus:border-gold outline-none"
            aria-label="search"
          />
          <div className="flex gap-2 flex-wrap">
            <select value={category} onChange={(e) => set('category', e.target.value)} className="border border-champagne bg-white rounded-full px-4 py-2.5 text-sm" aria-label="category">
              <option value="all">{locale === 'ar' ? 'كل الفئات' : 'All categories'}</option>
              <option value="wedding">{t(locale, 'wedding')}</option>
              <option value="engagement">{t(locale, 'engagement')}</option>
            </select>
            <select value={mode} onChange={(e) => set('mode', e.target.value)} className="border border-champagne bg-white rounded-full px-4 py-2.5 text-sm" aria-label="mode">
              <option value="all">{locale === 'ar' ? 'بيع وتأجير' : 'Sale & rental'}</option>
              <option value="sale">{t(locale, 'shop')}</option>
              <option value="rental">{t(locale, 'rent')}</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-champagne bg-white rounded-full px-4 py-2.5 text-sm" aria-label="sort">
              <option value="newest">{locale === 'ar' ? 'الأحدث' : 'Newest'}</option>
              <option value="price_asc">{locale === 'ar' ? 'السعر: من الأقل' : 'Price: low to high'}</option>
              <option value="price_desc">{locale === 'ar' ? 'السعر: من الأعلى' : 'Price: high to low'}</option>
              <option value="featured">{locale === 'ar' ? 'المميز أولاً' : 'Featured first'}</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center text-sm">
          {sizes.length > 0 && (
            <select value={size} onChange={(e) => setSize(e.target.value)} className="border border-champagne bg-white rounded-full px-4 py-2" aria-label={t(locale, 'size')}>
              <option value="">{t(locale, 'size')}: {locale === 'ar' ? 'الكل' : 'all'}</option>
              {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {colors.length > 0 && (
            <select value={color} onChange={(e) => setColor(e.target.value)} className="border border-champagne bg-white rounded-full px-4 py-2" aria-label={t(locale, 'color')}>
              <option value="">{t(locale, 'color')}: {locale === 'ar' ? 'الكل' : 'all'}</option>
              {colors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {styles.length > 0 && (
            <select value={style} onChange={(e) => setStyle(e.target.value)} className="border border-champagne bg-white rounded-full px-4 py-2" aria-label="style">
              <option value="">Style: {locale === 'ar' ? 'الكل' : 'all'}</option>
              {styles.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {ceiling > 0 && (
            <label className="flex items-center gap-2 border border-champagne bg-white rounded-full px-4 py-2">
              <span className="text-stone-soft text-xs">{locale === 'ar' ? 'حتى' : 'Up to'}</span>
              <input type="range" min={0} max={ceiling} step={ceiling / 20 || 1} value={maxPrice ?? ceiling}
                onChange={(e) => setMaxPrice(Number(e.target.value) >= ceiling ? null : Number(e.target.value))}
                aria-label="max price" className="accent-[#b99a5b]" />
              <span className="text-xs font-medium" dir="ltr">{maxPrice == null ? '∞' : formatMoney(maxPrice, 'EGP', locale)}</span>
            </label>
          )}
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs underline text-stone-soft px-2">
              {locale === 'ar' ? `مسح الفلاتر (${activeCount})` : `Clear filters (${activeCount})`}
            </button>
          )}
        </div>
      </div>
      {loading ? <SkeletonGrid /> : list.length === 0 ? <Empty message={t(locale, 'empty_catalog')} /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((d) => <DressCard key={d.id} dress={d} />)}
        </div>
      )}
    </main>
  );
}
