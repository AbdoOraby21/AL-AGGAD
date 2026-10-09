import { FlaskConical } from 'lucide-react';
import { isDemoMode } from '../lib/demo';
import { useLang } from '../app/LanguageContext';
import { t } from '../lib/i18n';

/** Persistent, tasteful demo indicator rendered on every page in demo mode. */
export function DemoBanner() {
  const { locale } = useLang();
  if (!isDemoMode()) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-gradient-to-l from-gold-deep via-gold to-gold-deep text-white text-center text-xs sm:text-sm py-1.5 px-4 font-medium tracking-wide"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <span className="inline-flex items-center gap-2">
        <FlaskConical size={14} aria-hidden="true" />
        {t(locale, 'demo_banner')}
      </span>
    </div>
  );
}
