import { useLang } from '../app/LanguageContext';
import { t } from '../lib/i18n';
import { MessageCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { isDemoMode } from '../lib/demo';

const WA = import.meta.env.VITE_WHATSAPP_NUMBER ?? '201000000000';

export function About() {
  const { locale } = useLang();
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <Logo />
      <h1 className="font-heading text-3xl mt-2">{t(locale, 'about')}</h1>
      <p className="mt-4 leading-8 text-stone-soft">
        {locale === 'ar'
          ? 'العقاد بوتيك متخصص في فساتين الزفاف والخطوبة — بيع وتأجير. نؤمن أن كل عروس تستحق فستاناً يليق بلحظتها: خامات راقية، مقاسات متنوعة، تجربة قياس خاصة، وفريق يساعدك من أول زيارة حتى يوم المناسبة.'
          : 'AL AGGAD is a bridal boutique for wedding & engagement dresses — sale and rental. Fine fabrics, inclusive sizes, private fittings, and a team with you from first visit to the big day.'}
      </p>
      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        {[{ ar: 'بيع فساتين الزفاف', en: 'Wedding dress sale' }, { ar: 'بيع فساتين الخطوبة', en: 'Engagement dress sale' }, { ar: 'تأجير مع ضمان التوفر', en: 'Rental with guaranteed availability' }].map((x, i) => (
          <div key={i} className="bg-white border border-champagne rounded-2xl p-4 text-center text-sm">{locale === 'ar' ? x.ar : x.en}</div>
        ))}
      </div>
    </main>
  );
}

export function Contact() {
  const { locale } = useLang();
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl">{t(locale, 'contact')}</h1>
      <div className="mt-6 bg-white border border-champagne rounded-3xl p-6 space-y-3">
        <p className="text-sm text-stone-soft">{locale === 'ar' ? 'العنوان وساعات العمل تُحدَّث من لوحة الإدارة (الإعدادات).' : 'Address & hours are managed in Admin → Settings.'}</p>
        <p><strong>WhatsApp: </strong>
          {isDemoMode()
            ? <span dir="ltr">{WA} {locale === 'ar' ? '(تجريبي)' : '(demo)'}</span>
            : <a dir="ltr" className="underline" href={`https://wa.me/${WA}`}>{WA}</a>}
        </p>
        <WhatsAppButton
          payload={{ to: WA, productName: 'AL AGGAD', productCode: 'GENERAL', intent: 'general', lang: locale }}
          className="inline-flex items-center gap-2 bg-cocoa text-ivory px-6 py-3 rounded-full">
          <MessageCircle size={17} /> {t(locale, 'whatsapp_inquire')}
        </WhatsAppButton>
      </div>
      <section className="mt-8">
        <h2 className="font-heading text-2xl mb-3">{locale === 'ar' ? 'أسئلة شائعة' : 'FAQ'}</h2>
        <div className="space-y-2 text-sm leading-7">
          <details className="bg-white border border-champagne rounded-2xl p-4"><summary className="font-medium cursor-pointer">{locale === 'ar' ? 'هل التأجير يشمل التنظيف؟' : 'Does rental include cleaning?'}</summary><p className="text-stone-soft mt-2">{locale === 'ar' ? 'نعم — التنظيف الاحترافي والفحص بعد كل إرجاع ضمن دورة الفستان، وفترات التنظيف تُحجب من التوفر.' : 'Yes — professional cleaning & inspection after every return; cleaning windows are blocked from availability.'}</p></details>
          <details className="bg-white border border-champagne rounded-2xl p-4"><summary className="font-medium cursor-pointer">{locale === 'ar' ? 'هل رسالة الواتساب تعتبر حجزاً مؤكداً؟' : 'Is a WhatsApp message a confirmed booking?'}</summary><p className="text-stone-soft mt-2">{locale === 'ar' ? 'لا — الحجز لا يُؤكَّد إلا بعد مراجعة الإدارة للتوفر داخل النظام.' : 'No — a booking is confirmed only after staff verify availability in the system.'}</p></details>
          <details className="bg-white border border-champagne rounded-2xl p-4"><summary className="font-medium cursor-pointer">{locale === 'ar' ? 'ما هو التأمين المسترد؟' : 'What is the refundable deposit?'}</summary><p className="text-stone-soft mt-2">{locale === 'ar' ? 'مبلغ يُحتجز ويُسترد بعد الفحص والإرجاع السليم، ويُخصم منه أي تأخير أو تلفيات حسب السياسة.' : 'An amount held and refunded after clean inspection; late fees or damages are deducted per policy.'}</p></details>
        </div>
      </section>
    </main>
  );
}

export function Policies() {
  const { locale } = useLang();
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 leading-8 text-sm">
      <h1 className="font-heading text-3xl mb-4">{locale === 'ar' ? 'السياسات والشروط' : 'Policies & Terms'}</h1>
      {[
        [locale === 'ar' ? 'سياسة التأجير' : 'Rental policy', locale === 'ar' ? 'الحجز طلب مبدئي (قيد المراجعة) ولا يُؤكَّد إلا بعد فحص التوفر. تُحتسب رسوم التأخير يومياً حسب الإعدادات، وفترات التنظيف والصيانة محجوبة من الحجز.' : 'Requests start as pending and are confirmed only after an availability check. Late fees accrue daily; cleaning/maintenance windows are blocked.'],
        [locale === 'ar' ? 'الاسترجاع والإلغاء' : 'Refunds & cancellation', locale === 'ar' ? 'العربون غير مسترد بعد التأكيد، والتأمين المسترد يُعاد بعد الفحص. تطبق قواعد الإلغاء الموضحة في الإعدادات.' : 'Booking deposits are non-refundable after confirmation; security deposits return after inspection. Cancellation rules per settings.'],
        [locale === 'ar' ? 'الخصوصية' : 'Privacy', locale === 'ar' ? 'بيانات العميلات تُستخدم لإدارة الطلبات والحجوزات فقط ولا تُشارك، مع وصول مقيد للأدوار المصرح لها.' : 'Customer data is used only for orders & bookings, with role-restricted access.'],
        [locale === 'ar' ? 'المدفوعات' : 'Payments', locale === 'ar' ? 'الدفع في المتجر أو عند الاستلام متاح. الدفع الإلكتروني يُفعَّل فقط بعد ربط بوابة دفع والتحقق عبر Webhook — لا يُقبل إثبات الدفع من المتصفح وحده.' : 'Pay-at-store / COD available. Online payments activate only via a verified provider webhook — browser redirects alone never mark payment.'],
      ].map(([h, b], i) => (
        <section key={i} className="bg-white border border-champagne rounded-2xl p-5 mb-3"><h2 className="font-medium mb-1">{h}</h2><p className="text-stone-soft">{b}</p></section>
      ))}
    </main>
  );
}

export function Favorites() {
  const { locale } = useLang();
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 text-center text-stone-soft">
      <h1 className="font-heading text-3xl text-cocoa mb-3">♥ {locale === 'ar' ? 'مفضلتي' : 'Favorites'}</h1>
      <p className="text-sm">{locale === 'ar' ? 'فساتينك المحفوظة على هذا الجهاز تظهر هنا.' : 'Your device-saved dresses appear here.'}</p>
    </main>
  );
}
