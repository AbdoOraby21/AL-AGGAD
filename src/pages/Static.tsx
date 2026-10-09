import { useLang } from '../app/LanguageContext';
import { t } from '../lib/i18n';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { isDemoMode } from '../lib/demo';
import { siteConfig } from '../lib/siteConfig';
import { usePageMeta } from '../lib/meta';

const WA = import.meta.env.VITE_WHATSAPP_NUMBER ?? '201000000000';

export function About() {
  const { locale } = useLang();
  usePageMeta(t(locale, 'about'));
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
  usePageMeta(t(locale, 'contact'));
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl">{t(locale, 'contact')}</h1>
      <div className="mt-6 bg-white border border-champagne rounded-3xl p-6 space-y-3">
        <p className="text-sm"><strong>{locale === 'ar' ? 'العنوان: ' : 'Address: '}</strong>{locale === 'ar' ? siteConfig.addressAr : siteConfig.addressEn}</p>
        <p className="text-sm"><strong>{locale === 'ar' ? 'المواعيد: ' : 'Hours: '}</strong>{locale === 'ar' ? siteConfig.hoursAr : siteConfig.hoursEn}</p>
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
  usePageMeta(locale === 'ar' ? 'السياسات والشروط' : 'Policies & Terms');
  const sections: Array<[string, string, string]> = [
    ['rental', t(locale, 'rental_policy'), locale === 'ar' ? 'الحجز طلب مبدئي (قيد المراجعة) ولا يُؤكَّد إلا بعد فحص التوفر. تُحتسب رسوم التأخير يومياً حسب الإعدادات، وفترات التنظيف والصيانة محجوبة من الحجز.' : 'Requests start as pending and are confirmed only after an availability check. Late fees accrue daily; cleaning/maintenance windows are blocked.'],
    ['sale', t(locale, 'sale_policy'), locale === 'ar' ? 'البيع نهائي بعد الاستلام والفحص ما لم يُتفق على غير ذلك. العربون غير مسترد بعد التأكيد.' : 'Sales are final after pickup and inspection unless agreed otherwise. Booking deposits are non-refundable after confirmation.'],
    ['privacy', t(locale, 'privacy'), locale === 'ar' ? 'نسخة العرض: لا تُجمع أي بيانات حقيقية — كل المدخلات عينات محلية في متصفحك. في الإنتاج: تُستخدم بيانات العميلات لإدارة الطلبات فقط بوصول مقيد.' : 'Demo: no real data is collected — all inputs are local samples in your browser. In production: customer data is used for orders only with restricted access.'],
    ['terms', t(locale, 'terms'), locale === 'ar' ? 'باستخدام نسخة العرض أنت توافق على أنها محاكاة: لا تنشأ حجوزات أو مدفوعات حقيقية، وجميع الأسعار استرشادية.' : 'By using the demo you agree it is a simulation: no real bookings or payments are created and all prices are illustrative.'],
    ['payments', locale === 'ar' ? 'المدفوعات' : 'Payments', locale === 'ar' ? 'الدفع في المتجر أو عند الاستلام متاح. الدفع الإلكتروني يُفعَّل فقط بعد ربط بوابة دفع والتحقق عبر Webhook.' : 'Pay-at-store / COD available. Online payments activate only via a verified provider webhook.'],
  ];
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 leading-8 text-sm">
      <h1 className="font-heading text-3xl mb-4">{locale === 'ar' ? 'السياسات والشروط' : 'Policies & Terms'}</h1>
      <nav className="flex gap-2 flex-wrap mb-4 text-xs">
        {sections.map(([id, h]) => <a key={id} href={`#${id}`} className="border border-champagne bg-white rounded-full px-3 py-1.5">{h}</a>)}
      </nav>
      {sections.map(([id, h, b]) => (
        <section key={id} id={id} className="bg-white border border-champagne rounded-2xl p-5 mb-3 scroll-mt-28"><h2 className="font-medium mb-1">{h}</h2><p className="text-stone-soft">{b}</p></section>
      ))}
    </main>
  );
}

const FAQ_ITEMS: Array<[string, string, string, string]> = [
  ['هل التأجير يشمل التنظيف؟', 'Does rental include cleaning?', 'نعم — التنظيف الاحترافي والفحص بعد كل إرجاع ضمن دورة الفستان، وفترات التنظيف تُحجب من التوفر.', 'Yes — professional cleaning & inspection after every return; cleaning windows are blocked from availability.'],
  ['هل رسالة الواتساب تعتبر حجزاً مؤكداً؟', 'Is a WhatsApp message a confirmed booking?', 'لا — الحجز لا يُؤكَّد إلا بعد مراجعة الإدارة للتوفر داخل النظام.', 'No — a booking is confirmed only after staff verify availability in the system.'],
  ['ما هو التأمين المسترد؟', 'What is the refundable deposit?', 'مبلغ يُحتجز ويُسترد بعد الفحص والإرجاع السليم، ويُخصم منه أي تأخير أو تلفيات حسب السياسة.', 'An amount held and refunded after clean inspection; late fees or damages are deducted per policy.'],
  ['هل الأسعار المعروضة نهائية؟', 'Are the displayed prices final?', 'في نسخة العرض جميع الأسعار استرشادية للتجربة فقط.', 'In the demo all prices are illustrative for trial only.'],
];

export function Faq() {
  const { locale } = useLang();
  usePageMeta(t(locale, 'faq_title'));
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl mb-4">{t(locale, 'faq_title')}</h1>
      <div className="space-y-2 text-sm leading-7">
        {FAQ_ITEMS.map(([qar, qen, aar, aen], i) => (
          <details key={i} className="bg-white border border-champagne rounded-2xl p-4">
            <summary className="font-medium cursor-pointer">{locale === 'ar' ? qar : qen}</summary>
            <p className="text-stone-soft mt-2">{locale === 'ar' ? aar : aen}</p>
          </details>
        ))}
      </div>
      <p className="mt-4 text-sm"><Link to="/contact" className="underline">{t(locale, 'contact')}</Link></p>
    </main>
  );
}

export function NotFound() {
  const { locale } = useLang();
  usePageMeta('404');
  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="font-wordmark text-5xl text-gold-deep" dir="ltr">404</p>
      <h1 className="font-heading text-3xl mt-2">{t(locale, 'notfound_title')}</h1>
      <p className="text-stone-soft mt-2 text-sm">{t(locale, 'notfound_body')}</p>
      <Link to="/" className="inline-block mt-6 bg-cocoa text-ivory rounded-full px-7 py-3 text-sm">{t(locale, 'back_home')}</Link>
    </main>
  );
}
