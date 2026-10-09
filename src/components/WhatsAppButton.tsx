import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { buildWhatsAppUrl, getWhatsAppAction, type WhatsAppPayload } from '../lib/whatsapp';
import { isDemoMode } from '../lib/demo';
import { useLang } from '../app/LanguageContext';
import { t } from '../lib/i18n';

interface Props {
  payload: WhatsAppPayload;
  className?: string;
  children: React.ReactNode;
}

/**
 * WhatsApp entry point. Production: normal wa.me link (opens a chat;
 * sending stays a manual user action). Demo: opens an in-app message
 * preview — wa.me is never navigated to, so no real message can be sent.
 */
export function WhatsAppButton({ payload, className, children }: Props) {
  const { locale } = useLang();
  const [open, setOpen] = useState(false);
  const demo = isDemoMode();

  if (!demo) {
    return (
      <a href={buildWhatsAppUrl(payload)} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  const action = getWhatsAppAction(payload);
  const message = action.kind === 'preview' ? action.message : [];
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} aria-haspopup="dialog">
        {children}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={t(locale, 'demo_whatsapp_title')}
          className="fixed inset-0 z-50 grid place-items-center bg-cocoa/60 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md bg-ivory rounded-3xl border border-gold/50 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-xl text-cocoa flex items-center gap-2">
                <MessageCircle size={18} /> {t(locale, 'demo_whatsapp_title')}
              </h2>
              <button onClick={() => setOpen(false)} aria-label={t(locale, 'demo_close')} className="p-1.5 rounded-full hover:bg-champagne/60">
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 bg-white border border-champagne rounded-2xl p-4 text-sm leading-7 whitespace-pre-line" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
              {message.join('\n')}
            </div>
            <p className="mt-3 text-xs bg-gold/15 border border-gold/40 text-cocoa rounded-xl p-3">
              {t(locale, 'demo_whatsapp_note')}
            </p>
            <button onClick={() => setOpen(false)} className="mt-4 w-full bg-cocoa text-ivory rounded-full py-2.5 text-sm">
              {t(locale, 'demo_close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
