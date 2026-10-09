import { LOGO_ALT, LOGO_DARK_SOURCES, LOGO_SOURCES } from '../lib/brand';
import { useState } from 'react';
import { useLang } from '../app/LanguageContext';

interface LogoProps {
  compact?: boolean;
  /** 'light' = default logo file for light backgrounds (header);
   *  'dark' = light-ink variant for dark backgrounds (footer). */
  tone?: 'light' | 'dark';
}

/**
 * AL AGGAD brand mark — always the supplied custom logo asset, never
 * re-typeset text. Tries public/images/ first, then public/brand/
 * (see src/lib/brand.ts); a marked typographic fallback renders only
 * while the asset file is missing.
 */
export function Logo({ compact = false, tone = 'light' }: LogoProps) {
  const { locale } = useLang();
  const [failedIdx, setFailedIdx] = useState(0);
  const sources = tone === 'dark' ? LOGO_DARK_SOURCES : LOGO_SOURCES;
  const src = sources[Math.min(failedIdx, sources.length - 1)];
  const height = compact ? 'h-10 md:h-11' : 'h-12 md:h-14';

  if (failedIdx < sources.length) {
    return (
      <span className="flex items-center gap-3" role="img" aria-label={LOGO_ALT}>
        <img
          src={src}
          alt={LOGO_ALT}
          onError={() => setFailedIdx((i) => i + 1)}
          className={`${height} w-auto max-w-[180px] md:max-w-[220px] object-contain shrink-0`}
          loading="eager"
          decoding="async"
        />
        <span className={`leading-none tracking-[0.35em] font-heading ${tone === 'dark' ? 'text-champagne' : 'text-gold-deep'} text-[10px] md:text-[11px]`} dir="ltr">
          {locale === 'ar' ? 'AL AGGAD' : 'AL AGGAD · BRIDAL'}
        </span>
      </span>
    );
  }

  // Fallback only while the asset file is missing — replaced automatically
  // once public/images/al-aggad-logo.png (or public/brand/) exists.
  return (
    <span className="flex items-center gap-3" aria-label={LOGO_ALT}>
      <span className={`font-wordmark leading-none ${tone === 'dark' ? 'text-ivory' : 'text-cocoa'} ${compact ? 'text-2xl' : 'text-3xl'}`}>العقاد</span>
      <span className={`leading-none tracking-[0.35em] font-heading ${tone === 'dark' ? 'text-champagne' : 'text-gold-deep'} text-[10px] md:text-[11px]`} dir="ltr">
        {locale === 'ar' ? 'AL AGGAD' : 'AL AGGAD · BRIDAL'}
      </span>
    </span>
  );
}
