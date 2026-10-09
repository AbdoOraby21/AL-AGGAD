import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isDemoMode } from '../lib/demo';
import type { Dress } from '../lib/types';

/** Demo catalog lives in ./demoCatalog (48 reviewed sample dresses). */
export { DEMO_DRESSES } from './demoCatalog';
import { DEMO_DRESSES } from './demoCatalog';

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
