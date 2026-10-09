import { FlaskConical, RotateCcw } from 'lucide-react';
import { clearDemoStorage, isDemoMode } from '../lib/demo';
import { useLang } from '../app/LanguageContext';
import { t } from '../lib/i18n';

/** Persistent, tasteful demo indicator rendered on every page in demo mode. */
export function DemoBanner() {
  const { locale } = useLang();
  if (!isDemoMode()) return null;
  const reset = () => {
    if (confirm(t(locale, 'reset_demo') + '؟')) {
      clearDemoStorage();
      window.location.reload();
    }
  };
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-gradient-to-l from-gold-deep via-gold to-gold-deep text-white text-center text-xs sm:text-sm py-1.5 px-4 font-medium tracking-wide"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <span className="inline-flex items-center gap-2 flex-wrap justify-center">
        <FlaskConical size={14} aria-hidden="true" />
        {t(locale, 'demo_banner')}
        <button onClick={reset} title={t(locale, 'reset_demo')}
          className="inline-flex items-center gap-1 underline underline-offset-2 text-[11px] opacity-90 hover:opacity-100">
          <RotateCcw size={12} aria-hidden="true" /> {t(locale, 'reset_demo')}
        </button>
      </span>
    </div>
  );
}
