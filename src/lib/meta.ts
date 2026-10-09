import { useEffect } from 'react';
import { useLang } from '../app/LanguageContext';

/** Per-route page titles + meta descriptions (AR/EN aware). */
export function usePageMeta(title: string, description?: string): void {
  const { locale } = useLang();
  useEffect(() => {
    const suffix = locale === 'ar' ? 'العقاد | AL AGGAD' : 'AL AGGAD | العقاد';
    document.title = `${title} — ${suffix}`;
    if (description) {
      let el = document.querySelector('meta[name="description"]');
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', 'description');
        document.head.appendChild(el);
      }
      el.setAttribute('content', description);
    }
  }, [title, description, locale]);
}
