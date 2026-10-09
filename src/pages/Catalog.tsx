import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLang } from '../app/LanguageContext';
import { t } from '../lib/i18n';
import { useDresses } from '../app/useDresses';
import { DressCard, Empty, SectionTitle, SkeletonGrid } from '../components/DressCard';
import type { ModeFilter } from '../lib/types';

export function Catalog() {
  const { locale } = useLang();
  const [params, setParams] = useSearchParams();
  const { dresses, loading } = useDresses();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [sort, setSort] = useState('newest');

  const category = params.get('category') ?? 'all';
  const mode: ModeFilter = (params.get('mode') as ModeFilter) || 'all';

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (!v || v === 'all') next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    let l = dresses.filter((d) => d.is_active && !d.is_sold);
    if (category !== 'all') l = l.filter((d) => d.category_slug === category);
    if (mode === 'sale') l = l.filter((d) => d.sale_enabled);
    if (mode === 'rental') l = l.filter((d) => d.rental_enabled);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      l = l.filter((d) => d.name_ar.includes(q.trim()) || d.name_en.toLowerCase().includes(s) || d.code.toLowerCase().includes(s));
    }
    l = [...l].sort((a, b) => {
      if (sort === 'price_asc') return (a.sale_price_minor ?? a.rental_price_minor ?? 0) - (b.sale_price_minor ?? b.rental_price_minor ?? 0);
      if (sort === 'price_desc') return (b.sale_price_minor ?? b.rental_price_minor ?? 0) - (a.sale_price_minor ?? a.rental_price_minor ?? 0);
      if (sort === 'featured') return Number(b.is_featured) - Number(a.is_featured);
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
    return l;
  }, [dresses, category, mode, q, sort]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <SectionTitle title={t(locale, 'catalog')} />
      <div className="flex flex-col md:flex-row gap-3 md:items-center mb-6">
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
      {loading ? <SkeletonGrid /> : list.length === 0 ? <Empty message={t(locale, 'empty_catalog')} /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((d) => <DressCard key={d.id} dress={d} />)}
        </div>
      )}
    </main>
  );
}
