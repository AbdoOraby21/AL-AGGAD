import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isDemoMode } from '../lib/demo';
import type { Dress } from '../lib/types';

/** Local fallback catalog used only when Supabase is not configured yet.
 *  Never seeded into production — real data comes from the database. */
export const DEMO_DRESSES: Dress[] = [
  {
    id: 'demo-1', code: 'AG-W-001', name_ar: 'فستان زفاف دانتيل ملكي', name_en: 'Royal Lace Wedding Gown',
    description_ar: 'دانتيل فرنسي فاخر مع طرحة طويلة وذيل ملكي.', description_en: 'French lace, long veil, royal train.',
    category_slug: 'wedding', style: 'A-Line', fabric: 'French lace & tulle',
    sizes: ['S', 'M', 'L'], colors: ['Ivory', 'White'],
    sale_enabled: true, sale_price_minor: 4500000,
    rental_enabled: true, rental_price_minor: 900000, deposit_minor: 500000, booking_deposit_minor: 200000,
    is_featured: true, is_new: true, is_active: true, is_sold: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [{ id: 'di1', dress_id: 'demo-1', url: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=900&q=80', sort: 0, is_primary: true }],
  },
  {
    id: 'demo-2', code: 'AG-E-001', name_ar: 'فستان خطوبة شامبين مطرز', name_en: 'Champagne Embroidered Engagement Dress',
    description_ar: 'تطريز يدوي ناعم بلون الشامبين.', description_en: 'Hand embroidery in champagne tones.',
    category_slug: 'engagement', style: 'Mermaid', fabric: 'Embroidered tulle',
    sizes: ['XS', 'S', 'M'], colors: ['Champagne', 'Blush'],
    sale_enabled: true, sale_price_minor: 2800000,
    rental_enabled: true, rental_price_minor: 550000, deposit_minor: 300000, booking_deposit_minor: 150000,
    is_featured: true, is_new: true, is_active: true, is_sold: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [{ id: 'di2', dress_id: 'demo-2', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&q=80', sort: 0, is_primary: true }],
  },
  {
    id: 'demo-3', code: 'AG-W-002', name_ar: 'فستان زفاف ساتان بسيط', name_en: 'Minimal Satin Wedding Dress',
    description_ar: 'ساتان ناعم بقصّة انسيابية راقية.', description_en: 'Fluid minimalist satin silhouette.',
    category_slug: 'wedding', style: 'Slip', fabric: 'Duchess satin',
    sizes: ['S', 'M'], colors: ['Ivory'],
    sale_enabled: true, sale_price_minor: 3200000,
    rental_enabled: false, rental_price_minor: null, deposit_minor: null, booking_deposit_minor: null,
    is_featured: false, is_new: false, is_active: true, is_sold: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [{ id: 'di3', dress_id: 'demo-3', url: 'https://images.unsplash.com/photo-1537635638046-4cb55c9272e0?w=900&q=80', sort: 0, is_primary: true }],
  },
];

export function useDresses() {
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (isDemoMode()) {
        // Demo showcase: clearly identified sample catalog, DB-independent.
        setDresses(DEMO_DRESSES.map((d) => ({ ...d, demoSample: true })));
        setLoading(false);
        return;
      }
      if (!isSupabaseConfigured) {
        setDresses(DEMO_DRESSES);
        setLoading(false);
        return;
      }
      try {
        const { data, error: err } = await supabase
          .from('dresses')
          .select('*, images:dress_images(*), units:dress_units(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (err) throw err;
        setDresses((data ?? []) as Dress[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'load failed');
        setDresses(DEMO_DRESSES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { dresses, loading, error };
}

export function primaryImage(d: Dress): string {
  const imgs = d.images ?? [];
  return imgs.find((i) => i.is_primary)?.url ?? imgs[0]?.url ?? 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=900&q=80';
}
