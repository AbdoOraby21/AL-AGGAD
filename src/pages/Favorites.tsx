import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useLang } from '../app/LanguageContext';
import { dressName, t } from '../lib/i18n';
import { formatMoney } from '../lib/money';
import { primaryImage, useDresses } from '../app/useDresses';
import { usePageMeta } from '../lib/meta';
import { isDemoMode } from '../lib/demo';

function readIds(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}
function writeIds(key: string, ids: string[]): void {
  try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* noop */ }
}

export function Favorites() {
  const { locale } = useLang();
  const { dresses } = useDresses();
  const [tick, setTick] = useState(0);
  const [compare, setCompare] = useState<string[]>(() => readIds('aggad-compare'));
  usePageMeta(t(locale, 'fav_title'));

  const favs = useMemo(() => {
    const ids = readIds('aggad-favs');
    return dresses.filter((d) => ids.includes(d.id));
  }, [dresses, tick]);

  const toggleFav = (id: string) => {
    writeIds('aggad-favs', readIds('aggad-favs').filter((x) => x !== id));
    setCompare((c) => { const n = c.filter((x) => x !== id); writeIds('aggad-compare', n); return n; });
    setTick((x) => x + 1);
  };
  const toggleCompare = (id: string) => {
    setCompare((c) => {
      if (c.includes(id)) { const n = c.filter((x) => x !== id); writeIds('aggad-compare', n); return n; }
      if (c.length >= 3) return c;
      const n = [...c, id]; writeIds('aggad-compare', n); return n;
    });
  };
  const compared = dresses.filter((d) => compare.includes(d.id));

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-heading text-3xl mb-1">♥ {t(locale, 'fav_title')}</h1>
      {isDemoMode() && <p className="text-xs text-stone-soft mb-4">{t(locale, 'demo_local_note')}</p>}
      {favs.length === 0 ? (
        <p className="bg-white border border-champagne rounded-2xl p-8 text-center text-stone-soft">
          {t(locale, 'empty_fav')} <Link to="/catalog" className="underline">{t(locale, 'catalog')}</Link>
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {favs.map((d) => (
              <article key={d.id} className="bg-white rounded-2xl overflow-hidden border border-champagne">
                <Link to={`/dress/${d.code}`}><img src={primaryImage(d)} alt={dressName(d, locale)} loading="lazy" className="w-full aspect-[3/4] object-cover" /></Link>
                <div className="p-3">
                  <p className="text-sm font-medium line-clamp-1">{dressName(d, locale)}</p>
                  <p className="text-sm font-semibold mt-1">{formatMoney(d.sale_price_minor ?? d.rental_price_minor, 'EGP', locale)}</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => toggleFav(d.id)} className="text-xs underline text-stone-soft flex items-center gap-1">
                      <Heart size={12} /> {t(locale, 'remove')}
                    </button>
                    <button onClick={() => toggleCompare(d.id)}
                      className={`text-xs rounded-full px-2.5 py-1 border ${compare.includes(d.id) ? 'bg-cocoa text-ivory border-cocoa' : 'border-champagne'}`}>
                      {t(locale, 'add_compare')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {compare.length >= 3 && <p className="text-xs text-stone-soft mt-2">{t(locale, 'compare_limit')}</p>}
          {compared.length >= 2 && (
            <section className="mt-8">
              <h2 className="font-heading text-2xl mb-3">{t(locale, 'compare_title')}</h2>
              <div className="overflow-x-auto bg-white border border-champagne rounded-2xl">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="border-b border-champagne">
                      <th className="p-3 text-start font-medium text-stone-soft">—</th>
                      {compared.map((d) => <th key={d.id} className="p-3 text-start font-medium">{dressName(d, locale)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-champagne/60">
                      <td className="p-3 text-stone-soft">{t(locale, 'price')}</td>
                      {compared.map((d) => <td key={d.id} className="p-3 font-semibold">{formatMoney(d.sale_price_minor ?? d.rental_price_minor, 'EGP', locale)}</td>)}
                    </tr>
                    <tr className="border-b border-champagne/60">
                      <td className="p-3 text-stone-soft">{t(locale, 'size')}</td>
                      {compared.map((d) => <td key={d.id} className="p-3" dir="ltr">{d.sizes.join(', ') || '—'}</td>)}
                    </tr>
                    <tr className="border-b border-champagne/60">
                      <td className="p-3 text-stone-soft">{locale === 'ar' ? 'الفئة' : 'Category'}</td>
                      {compared.map((d) => <td key={d.id} className="p-3">{d.category_slug}</td>)}
                    </tr>
                    <tr>
                      <td className="p-3 text-stone-soft">{t(locale, 'rent')}</td>
                      {compared.map((d) => <td key={d.id} className="p-3">{d.rental_enabled ? `${t(locale, 'available')} · ${formatMoney(d.rental_price_minor, 'EGP', locale)}` : t(locale, 'unavailable')}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
