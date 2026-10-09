import { useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2 } from 'lucide-react';
import type { Dress } from '../lib/types';
import { dressName, t, type DictKey } from '../lib/i18n';
import { formatMoney, formatDate } from '../lib/money';
import { useLang } from '../app/LanguageContext';
import { useToast } from '../app/ToastContext';
import { submitRentalBooking } from '../lib/transactions';
import {
  DEMO_BLOCKING_STATUSES,
  DEMO_STATUS_LABELS,
  findDemoConflicts,
  freeSlots,
  isDemoMode,
  isSlotTaken,
  suggestNextSlot,
} from '../lib/demo';
import { WhatsAppButton } from './WhatsAppButton';

const STATUS_ORDER: Array<keyof typeof DEMO_STATUS_LABELS> = [
  'pending_review', 'confirmed', 'ready_for_pickup', 'checked_out', 'returned', 'completed',
];

/** Small availability month grid (demo simulation only). */
function AvailabilityCalendar({ dressId }: { dressId: string }) {
  const { locale } = useLang();
  const [offset, setOffset] = useState(0);
  const base = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + offset, 1);
  }, [offset]);
  const cells = useMemo(() => {
    const y = base.getFullYear();
    const m = base.getMonth();
    const firstDow = (new Date(y, m, 1).getDay() + 7 - (locale === 'ar' ? 6 : 0)) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const out: Array<{ day: number; iso: string; blocked: boolean } | null> = [];
    for (let i = 0; i < firstDow; i++) out.push(null);
    for (let d = 1; d <= days; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      out.push({ day: d, iso, blocked: findDemoConflicts(dressId, iso, iso).length > 0 });
    }
    return out;
  }, [base, dressId, locale]);
  return (
    <div className="bg-ivory border border-champagne rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setOffset(offset - 1)} className="px-2 py-1 text-lg" aria-label="prev">‹</button>
        <p className="text-sm font-medium">{formatDate(`${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-01`, locale)}</p>
        <button type="button" onClick={() => setOffset(offset + 1)} className="px-2 py-1 text-lg" aria-label="next">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {cells.map((c, i) => c === null ? <span key={i} /> : (
          <span key={i} title={c.blocked ? t(locale, 'blocked') : t(locale, 'free')}
            className={`py-1.5 rounded-lg ${c.blocked ? 'bg-red-100 text-red-800 line-through' : 'bg-green-50 text-green-900'}`}>
            {c.day}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-stone-soft">{t(locale, 'demo_calendar_note')}</p>
    </div>
  );
}

export function RentalFlow({ dress }: { dress: Dress }) {
  const { locale } = useLang();
  const { push } = useToast();
  const demo = isDemoMode();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [size, setSize] = useState(dress.sizes[0] ?? '');
  const [occasion, setOccasion] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [slot, setSlot] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const conflicts = useMemo(
    () => (demo && start && end ? findDemoConflicts(dress.id, start, end) : []),
    [demo, dress.id, start, end],
  );
  const suggestion = useMemo(() => {
    if (!demo || conflicts.length === 0 || !start || !end) return null;
    const len = Math.max(0, Math.round((+new Date(end) - +new Date(start)) / 86400000));
    return suggestNextSlot(dress.id, start, len);
  }, [demo, conflicts, dress.id, start, end]);
  const slots = useMemo(() => (start ? freeSlots(start) : []), [start]);
  const WA = import.meta.env.VITE_WHATSAPP_NUMBER ?? '201000000000';

  const validDetails = name.trim().length >= 2 && phone.trim().length >= 8 && start !== '' && end !== '' && start <= end;

  const submit = async () => {
    setErr(null);
    if (!validDetails) { setErr(t(locale, 'invalid_dates')); return; }
    if (demo && conflicts.length > 0) { setErr(t(locale, 'conflict_found')); return; }
    if (demo && start && slot && isSlotTaken(start, slot)) { setErr(t(locale, 'slot_taken')); return; }
    setBusy(true);
    try {
      const { reference } = await submitRentalBooking({
        dressId: dress.id, dressCode: dress.code, name: name.trim(), phone: phone.trim(),
        occasionDate: occasion || undefined, startDate: start, endDate: end,
        size: size || undefined, slot: slot || undefined,
        rentalFeeMinor: dress.rental_price_minor ?? 0,
        bookingDepositMinor: dress.booking_deposit_minor ?? 0,
        securityDepositMinor: dress.deposit_minor ?? 0,
        currency: 'EGP',
      });
      setRef(reference);
      setStep(3);
      push('success', `${t(locale, 'booking_success')} ${reference}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t(locale, 'error_generic'));
    } finally {
      setBusy(false);
    }
  };

  const steps: DictKey[] = ['review', 'slot', 'review'];
  return (
    <div className="mt-6 bg-white border border-champagne rounded-3xl p-6">
      <h2 className="font-heading text-2xl">{t(locale, 'rental_flow_title')}</h2>
      {demo && <p className="mt-1 text-xs bg-gold/15 border border-gold/40 rounded-xl p-2.5">{t(locale, 'demo_booking_note')} {t(locale, 'demo_local_note')}</p>}
      <ol className="mt-4 flex gap-2 text-xs" aria-label="steps">
        {[0, 1, 2].map((i) => (
          <li key={i} className={`flex-1 text-center rounded-full py-1.5 ${step >= i ? 'bg-cocoa text-ivory' : 'bg-champagne/50 text-stone-soft'}`}>
            {t(locale, 'step')} {i + 1}{i === 2 ? ` · ${t(locale, steps[2])}` : i === 1 ? ` · ${t(locale, 'slot')}` : ''}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <label className="text-sm">{t(locale, 'name')}*<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
          <label className="text-sm" dir="ltr">{t(locale, 'phone')}*<input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
          {dress.sizes.length > 0 && (
            <label className="text-sm">{t(locale, 'size')}
              <select value={size} onChange={(e) => setSize(e.target.value)} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2">
                {dress.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          )}
          <label className="text-sm">{t(locale, 'occasion_date')}<input type="date" value={occasion} onChange={(e) => setOccasion(e.target.value)} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
          <label className="text-sm">{t(locale, 'start_date')}*<input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
          <label className="text-sm">{t(locale, 'end_date')}*<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
          {demo && (
            <div className="sm:col-span-2">
              <p className="text-sm font-medium mb-2">{t(locale, 'availability_calendar')}</p>
              <AvailabilityCalendar dressId={dress.id} />
            </div>
          )}
          {demo && conflicts.length > 0 && (
            <div className="sm:col-span-2 text-sm bg-red-50 border border-red-200 text-red-900 rounded-xl p-3">
              <p className="font-medium">{t(locale, 'conflict_found')} ({conflicts.map((c) => c.reference).join(', ')})</p>
              {suggestion && (
                <button type="button" onClick={() => { setStart(suggestion.start); setEnd(suggestion.end); }}
                  className="mt-2 underline text-xs">
                  {t(locale, 'use_suggestion')}: <span dir="ltr">{suggestion.start} → {suggestion.end}</span>
                </button>
              )}
            </div>
          )}
          {err && <p className="sm:col-span-2 text-sm text-red-700">{err}</p>}
          <div className="sm:col-span-2">
            <button type="button" disabled={!validDetails} onClick={() => { setErr(null); setStep(1); }}
              className="btn-lux w-full bg-cocoa text-ivory rounded-full py-3 disabled:opacity-40">{t(locale, 'continue')}</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2 flex items-center gap-2"><CalendarCheck size={16} /> {t(locale, 'pick_slot')} <span dir="ltr" className="text-stone-soft">{start}</span></p>
          {slots.length === 0 && <p className="text-sm text-stone-soft">{t(locale, 'slot_taken')}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {slots.map((s) => (
              <button key={s} type="button" onClick={() => setSlot(s)} dir="ltr"
                className={`rounded-xl border px-3 py-2.5 text-sm ${slot === s ? 'bg-cocoa text-ivory border-cocoa' : 'bg-white border-champagne'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setStep(0)} className="flex-1 border border-champagne rounded-full py-3 text-sm">{t(locale, 'back')}</button>
            <button type="button" disabled={!slot} onClick={() => setStep(2)} className="flex-1 bg-cocoa text-ivory rounded-full py-3 text-sm disabled:opacity-40">{t(locale, 'continue')}</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 text-sm space-y-2">
          <h3 className="font-medium">{t(locale, 'price_breakdown')}</h3>
          <div className="bg-ivory border border-champagne rounded-2xl p-4 space-y-1.5">
            <p className="flex justify-between"><span>{t(locale, 'rental_price')}</span><strong>{formatMoney(dress.rental_price_minor, 'EGP', locale)}</strong></p>
            <p className="flex justify-between"><span>{t(locale, 'booking_deposit')}</span><span>{formatMoney(dress.booking_deposit_minor, 'EGP', locale)}</span></p>
            <p className="flex justify-between"><span>{t(locale, 'deposit')}</span><span>{formatMoney(dress.deposit_minor, 'EGP', locale)}</span></p>
            <p className="flex justify-between text-xs text-stone-soft"><span>{t(locale, 'size')} / {t(locale, 'slot')}</span><span dir="ltr">{size} · {slot}</span></p>
            <p className="flex justify-between text-xs text-stone-soft"><span>{t(locale, 'start_date')} → {t(locale, 'end_date')}</span><span dir="ltr">{start} → {end}</span></p>
          </div>
          {err && <p className="text-red-700">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="flex-1 border border-champagne rounded-full py-3">{t(locale, 'back')}</button>
            <button type="button" disabled={busy} onClick={() => void submit()} className="flex-1 bg-gold text-white rounded-full py-3 disabled:opacity-50">
              {busy ? t(locale, 'loading') : demo ? t(locale, 'submit_demo_request') : t(locale, 'submit_booking')}
            </button>
          </div>
        </div>
      )}

      {step === 3 && ref && (
        <div className="mt-4 text-sm">
          <p className="flex items-center gap-2 text-green-900 font-medium"><CheckCircle2 size={18} /> {t(locale, 'booking_success')}</p>
          <p className="text-xl font-bold mt-1" dir="ltr">{ref}</p>
          {demo && <p className="mt-2 text-xs bg-gold/15 border border-gold/40 rounded-xl p-2.5">{t(locale, 'demo_booking_note')}</p>}
          <h3 className="mt-4 font-medium">{t(locale, 'demo_timeline')}</h3>
          <ol className="mt-2 space-y-1.5">
            {STATUS_ORDER.map((s, i) => (
              <li key={s} className={`rounded-xl border px-3 py-2 ${i === 0 ? 'bg-champagne/50 border-gold/50' : 'border-champagne text-stone-soft'}`}>
                <span className="text-xs font-medium">{i + 1}. </span>
                {locale === 'ar' ? DEMO_STATUS_LABELS[s].ar : DEMO_STATUS_LABELS[s].en}
                {demo && <span className="ms-2 text-[10px] bg-gold-deep text-white px-2 py-0.5 rounded-full align-middle">{t(locale, 'demo_sample')}</span>}
              </li>
            ))}
          </ol>
          <div className="mt-3">
            <WhatsAppButton payload={{ to: WA, productName: dressName(dress, locale), productCode: dress.code, intent: 'rental', size: size || undefined, bookingRef: ref, lang: locale }}>
              <span className="underline">{locale === 'ar' ? 'تأكيد عبر واتساب' : 'Confirm via WhatsApp'}</span>
            </WhatsAppButton>
          </div>
          <p className="mt-2 text-[11px] text-stone-soft">Demo statuses checked: {DEMO_BLOCKING_STATUSES.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
