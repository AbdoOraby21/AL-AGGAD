import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface CartItem { dressId: string; code: string; nameAr: string; nameEn: string; image?: string; size?: string; color?: string; priceMinor: number; qty: number; }

interface CartCtx {
  items: CartItem[];
  add: (i: CartItem) => void;
  remove: (dressId: string, size?: string, color?: string) => void;
  clear: () => void;
  total: number;
  count: number;
}

const Ctx = createContext<CartCtx>({ items: [], add: () => {}, remove: () => {}, clear: () => {}, total: 0, count: 0 });

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
  const clear = useCallback(() => { setItems([]); try { localStorage.removeItem('aggad-cart'); } catch { /* noop */ } }, []);
  const { total, count } = useMemo(() => ({
    total: items.reduce((s, x) => s + x.priceMinor * x.qty, 0),
    count: items.reduce((s, x) => s + x.qty, 0),
  }), [items]);
  const value = useMemo(() => ({ items, add, remove, clear, total, count }), [items, add, remove, clear, total, count]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => useContext(Ctx);
