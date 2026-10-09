/** Build a prefilled WhatsApp chat URL. Opening WhatsApp ≠ confirmed booking. */
export interface WhatsAppPayload {
  to: string; // digits only, e.g. 2010XXXXXXXX
  productName: string;
  productCode: string;
  intent: 'sale' | 'rental' | 'general';
  size?: string;
  color?: string;
  occasionDate?: string;
  pageUrl?: string;
  bookingRef?: string;
  lang?: 'ar' | 'en';
}

import { isDemoMode } from './demo';

/** Message lines for the prefilled chat (shared by the live link and the demo preview). */
export function buildWhatsAppMessage(p: WhatsAppPayload): string[] {
  if (p.lang === 'en') {
    return [
      `Hello AL AGGAD 🤍`,
      `I'm interested in: ${p.productName} (${p.productCode})`,
      `Intent: ${p.intent === 'sale' ? 'Purchase' : p.intent === 'rental' ? 'Rental' : 'Inquiry'}`,
      ...(p.size ? [`Size: ${p.size}`] : []),
      ...(p.color ? [`Color: ${p.color}`] : []),
      ...(p.occasionDate ? [`Occasion date: ${p.occasionDate}`] : []),
      ...(p.bookingRef ? [`Booking ref: ${p.bookingRef}`] : []),
      ...(p.pageUrl ? [p.pageUrl] : []),
    ];
  }
  return [
    `أهلاً العقاد 🤍`,
    `أنا مهتمة بـ: ${p.productName} (${p.productCode})`,
    `الطلب: ${p.intent === 'sale' ? 'شراء' : p.intent === 'rental' ? 'تأجير' : 'استفسار'}`,
    ...(p.size ? [`المقاس: ${p.size}`] : []),
    ...(p.color ? [`اللون: ${p.color}`] : []),
    ...(p.occasionDate ? [`تاريخ المناسبة: ${p.occasionDate}`] : []),
    ...(p.bookingRef ? [`رقم الحجز: ${p.bookingRef}`] : []),
    ...(p.pageUrl ? [p.pageUrl] : []),
  ];
}

export function buildWhatsAppUrl(p: WhatsAppPayload): string {
  return `https://wa.me/${p.to}?text=${encodeURIComponent(buildWhatsAppMessage(p).join('\n'))}`;
}

/**
 * Demo-safe routing for WhatsApp actions. In demo mode callers must render
 * a message preview instead of navigating to wa.me (no chat is ever opened).
 */
export function getWhatsAppAction(p: WhatsAppPayload): { kind: 'preview'; message: string[] } | { kind: 'link'; url: string } {
  if (isDemoMode()) return { kind: 'preview', message: buildWhatsAppMessage(p) };
  return { kind: 'link', url: buildWhatsAppUrl(p) };
}
