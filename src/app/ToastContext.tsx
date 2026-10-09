import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface Toast { id: number; kind: 'success' | 'error' | 'info'; message: string; }

const Ctx = createContext<{ toasts: Toast[]; push: (kind: Toast['kind'], message: string) => void; dismiss: (id: number) => void }>({
  toasts: [], push: () => {}, dismiss: () => {},
});

let seq = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((p) => p.filter((x) => x.id !== id)), []);
  const push = useCallback((kind: Toast['kind'], message: string) => {
    const id = seq++;
    setToasts((p) => [...p, { id, kind, message }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useToast = () => useContext(Ctx);
