import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { validatePromo } from '../lib/demo';

export interface CartItem { dressId: string; code: string; nameAr: string; nameEn: string; image?: string; size?: string; color?: string; priceMinor: number; qty: number; }

interface CartCtx {
  items: CartItem[];
  add: (i: CartItem) => void;
  remove: (dressId: string, size?: string, color?: string) => void;
  setQty: (dressId: string, size: string | undefined, color: string | undefined, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
  promoCode: string | null;
  promoPct: number;
  discountedTotal: number;
  applyPromo: (code: string) => boolean;
  clearPromo: () => void;
}

const Ctx = createContext<CartCtx>({ items: [], add: () => {}, remove: () => {}, setQty: () => {}, clear: () => {}, total: 0, count: 0, promoCode: null, promoPct: 0, discountedTotal: 0, applyPromo: () => false, clearPromo: () => {} });

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('aggad-cart') ?? '[]'); } catch { return []; }
  });
  const persist = (next: CartItem[]) => {
    setItems(next);
    try { localStorage.setItem('aggad-cart', JSON.stringify(next)); } catch { /* noop */ }
  };
  const add = useCallback((i: CartItem) => {
    setItems((prev) => {
      const k = (x: CartItem) => `${x.dressId}|${x.size}|${x.color}`;
      const found = prev.find((x) => k(x) === k(i));
      const next = found
        ? prev.map((x) => (k(x) === k(i) ? { ...x, qty: x.qty + i.qty } : x))
        : [...prev, i];
      try { localStorage.setItem('aggad-cart', JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
    void persist;
  }, []);
  const remove = useCallback((dressId: string, size?: string, color?: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => !(x.dressId === dressId && x.size === size && x.color === color));
      try { localStorage.setItem('aggad-cart', JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);
  const clear = useCallback(() => { setItems([]); setPromoCode(null); try { localStorage.removeItem('aggad-cart'); } catch { /* noop */ } }, []);
  const setQty = useCallback((dressId: string, size: string | undefined, color: string | undefined, qty: number) => {
    setItems((prev) => {
      const next = qty <= 0
        ? prev.filter((x) => !(x.dressId === dressId && x.size === size && x.color === color))
        : prev.map((x) => (x.dressId === dressId && x.size === size && x.color === color ? { ...x, qty: Math.min(9, qty) } : x));
      try { localStorage.setItem('aggad-cart', JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoPct, setPromoPct] = useState(0);
  /** Simulation-only promo validation against local demo codes. */
  const applyPromo = useCallback((code: string) => {
    const p = validatePromo(code);
    if (!p) { setPromoCode(null); setPromoPct(0); return false; }
    setPromoCode(p.code); setPromoPct(p.percent);
    return true;
  }, []);
  const clearPromo = useCallback(() => { setPromoCode(null); setPromoPct(0); }, []);
  const { total, count } = useMemo(() => ({
    total: items.reduce((s, x) => s + x.priceMinor * x.qty, 0),
    count: items.reduce((s, x) => s + x.qty, 0),
  }), [items]);
  const discountedTotal = useMemo(() => Math.round(total * (1 - promoPct / 100)), [total, promoPct]);
  const value = useMemo(() => ({ items, add, remove, setQty, clear, total, count, promoCode, promoPct, discountedTotal, applyPromo, clearPromo }),
    [items, add, remove, setQty, clear, total, count, promoCode, promoPct, discountedTotal, applyPromo, clearPromo]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => useContext(Ctx);
