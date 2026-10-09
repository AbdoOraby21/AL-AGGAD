import { Link } from 'react-router-dom';
import { CalendarCheck, MessageCircle, Ruler, Sparkles } from 'lucide-react';
import { useLang } from '../app/LanguageContext';
import { t } from '../lib/i18n';
import { useDresses } from '../app/useDresses';
import { DressCard, SectionTitle, SkeletonGrid, Empty } from '../components/DressCard';
import { Logo } from '../components/Logo';
import { WhatsAppButton } from '../components/WhatsAppButton';

const HERO = 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=1800&q=80';

export function Home() {
  const { locale } = useLang();
  const { dresses, loading } = useDresses();
  const featured = dresses.filter((d) => d.is_featured).slice(0, 4);
  const fresh = dresses.filter((d) => d.is_new).slice(0, 4);
  const WA = import.meta.env.VITE_WHATSAPP_NUMBER ?? '201000000000';

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={HERO} alt="AL AGGAD bridal" className="w-full h-[78vh] min-h-[520px] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa/70 via-cocoa/25 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end text-center pb-16 px-4 fade-up">
          <Logo tone="dark" />
          <p className="text-ivory/80 tracking-[0.4em] text-xs mb-4" dir="ltr">AL AGGAD · BRIDAL BOUTIQUE</p>
          <h1 className="text-ivory text-3xl md:text-5xl font-heading max-w-3xl leading-tight">
            {locale === 'ar' ? 'فستانك المثالي.. ولحظتك التي لا تُنسى.' : 'Your Perfect Dress. Your Unforgettable Moment.'}
          </h1>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/catalog?category=wedding" className="btn-lux bg-ivory text-cocoa px-7 py-3 rounded-full font-medium hover:bg-champagne">{t(locale, 'explore_wedding')}</Link>
            <Link to="/catalog?category=engagement" className="btn-lux border border-ivory text-ivory px-7 py-3 rounded-full hover:bg-ivory hover:text-cocoa">{t(locale, 'explore_engagement')}</Link>
          </div>
          <div className="mt-3 flex gap-3 text-sm">
            <Link to="/catalog?mode=sale" className="text-champagne underline underline-offset-4">{t(locale, 'shop')}</Link>
            <Link to="/catalog?mode=rental" className="text-champagne underline underline-offset-4">{t(locale, 'rent')}</Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {/* Featured */}
        <section className="pt-14">
          <SectionTitle title={t(locale, 'featured')} />
          {loading ? <SkeletonGrid /> : featured.length === 0 ? <Empty message={t(locale, 'empty_catalog')} /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{featured.map((d) => <DressCard key={d.id} dress={d} />)}</div>
          )}
        </section>

        {/* New arrivals */}
        <section className="pt-14">
          <SectionTitle title={t(locale, 'new_arrivals')} />
          {loading ? <SkeletonGrid /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{fresh.map((d) => <DressCard key={d.id} dress={d} />)}</div>
          )}
        </section>

        {/* How rental works */}
        <section className="pt-14">
          <SectionTitle title={t(locale, 'how_rental_works')} />
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: <Sparkles size={20} />, ar: 'اختاري الفستان والمقاس', en: 'Choose your dress & size' },
              { icon: <CalendarCheck size={20} />, ar: 'حددي تاريخ المناسبة والاستلام والإرجاع', en: 'Pick occasion, pickup & return dates' },
              { icon: <Ruler size={20} />, ar: 'نتحقق من التوفر والسعر والتأمين', en: 'We verify availability, price & deposit' },
              { icon: <MessageCircle size={20} />, ar: 'نؤكد الحجز وتستلمي فستانك', en: 'We confirm — you shine' },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-champagne rounded-2xl p-5 text-center">
                <div className="mx-auto w-11 h-11 grid place-items-center rounded-full bg-champagne/50 text-cocoa mb-3">{s.icon}</div>
                <p className="text-sm font-medium">{locale === 'ar' ? `${i + 1}. ${s.ar}` : `${i + 1}. ${s.en}`}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Boutique intro + WhatsApp */}
        <section className="py-14 grid md:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-3xl overflow-hidden img-zoom">
            <img src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&q=80" alt="boutique" loading="lazy" className="w-full h-full min-h-[280px] object-cover" />
          </div>
          <div className="bg-white border border-champagne rounded-3xl p-8 flex flex-col justify-center">
            <Logo />
            <p className="mt-4 text-stone-soft leading-7">
              {locale === 'ar'
                ? 'بوتيك متخصص في فساتين الزفاف والخطوبة — بيع وتأجير بلمسة راقية وتجربة خاصة لكل عروس. اختاري فستانك من تشكيلتنا، أو احجزيه للإيجار مع ضمان التوفر والتنظيف الاحترافي.'
                : 'A boutique for wedding & engagement dresses — sale and rental with a private, premium experience for every bride.'}
            </p>
            <WhatsAppButton
              payload={{ to: WA, productName: 'AL AGGAD', productCode: 'APPOINTMENT', intent: 'general', lang: locale }}
              className="btn-lux mt-6 inline-flex w-fit items-center gap-2 bg-cocoa text-ivory px-6 py-3 rounded-full hover:bg-gold-deep">
              <MessageCircle size={17} /> {t(locale, 'whatsapp_inquire')}
            </WhatsAppButton>
          </div>
        </section>
      </div>
    </main>
  );
}
