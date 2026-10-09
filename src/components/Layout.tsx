import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Globe, Heart, Menu, MessageCircle, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { useLang } from '../app/LanguageContext';
import { useCart } from '../app/CartContext';
import { t } from '../lib/i18n';
import { Logo } from './Logo';
import { WhatsAppButton } from './WhatsAppButton';
import { siteConfig } from '../lib/siteConfig';

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '201000000000';

export function Header() {
  const { locale, setLocale } = useLang();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-full text-sm transition ${isActive ? 'bg-cocoa text-ivory' : 'hover:bg-champagne/60 text-cocoa'}`;

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-cocoa text-ivory text-center text-xs sm:text-sm py-2 px-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        {t(locale, 'announcement_default')}
      </div>
      <div className="bg-ivory/90 backdrop-blur border-b border-champagne">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-[76px]">
          <Link to="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="main">
            <NavLink to="/" className={linkCls}>{t(locale, 'home')}</NavLink>
            <NavLink to="/catalog?category=wedding" className={linkCls}>{t(locale, 'wedding')}</NavLink>
            <NavLink to="/catalog?category=engagement" className={linkCls}>{t(locale, 'engagement')}</NavLink>
            <NavLink to="/catalog?category=evening" className={linkCls}>{t(locale, 'evening')}</NavLink>
            <NavLink to="/about" className={linkCls}>{t(locale, 'about')}</NavLink>
            <NavLink to="/contact" className={linkCls}>{t(locale, 'contact')}</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              className="btn-lux flex items-center gap-1 text-sm border border-gold/60 rounded-full px-3 py-1.5 hover:bg-champagne/60"
              aria-label="language switcher"
            >
              <Globe size={15} /> {locale === 'ar' ? 'EN' : 'عربي'}
            </button>
            <WhatsAppButton
              payload={{ to: WA_NUMBER, productName: 'AL AGGAD', productCode: 'GENERAL', intent: 'general', lang: locale }}
              className="hidden sm:flex items-center gap-1 text-sm bg-[#25D366]/15 text-green-900 border border-green-700/20 rounded-full px-3 py-1.5 hover:bg-[#25D366]/25"
            >
              <MessageCircle size={15} /> WhatsApp
            </WhatsAppButton>
            <button onClick={() => nav('/favorites')} className="p-2 rounded-full hover:bg-champagne/60" aria-label="favorites">
              <Heart size={18} />
            </button>
            <button onClick={() => nav('/cart')} className="relative p-2 rounded-full hover:bg-champagne/60" aria-label="cart">
              <ShoppingBag size={18} />
              {count > 0 && <span className="absolute -top-0.5 -end-0.5 bg-gold text-white text-[11px] w-5 h-5 grid place-items-center rounded-full">{count}</span>}
            </button>
            <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="menu">{open ? <X /> : <Menu />}</button>
          </div>
        </div>
        {open && (
          <nav className="md:hidden border-t border-champagne px-4 py-3 flex flex-col gap-1 bg-ivory">
            {[['/', t(locale, 'home')], ['/catalog?category=wedding', t(locale, 'wedding')], ['/catalog?category=engagement', t(locale, 'engagement')], ['/catalog?category=evening', t(locale, 'evening')], ['/about', t(locale, 'about')], ['/contact', t(locale, 'contact')], ['/faq', t(locale, 'faq_title')], ['/favorites', t(locale, 'fav_title')], ['/admin', t(locale, 'admin')]].map(([to, label]) => (
              <Link key={to + label} to={to} onClick={() => setOpen(false)} className="py-2 border-b border-champagne/50 last:border-0">{label}</Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  const { locale } = useLang();
  return (
    <footer className="bg-cocoa text-ivory mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div><Logo tone="dark" /></div>
          <p className="mt-3 text-sm text-ivory/70">{t(locale, 'tagline')}</p>
        </div>
        <div>
          <h4 className="font-heading text-champagne mb-3">{t(locale, 'catalog')}</h4>
          <ul className="space-y-2 text-sm text-ivory/80">
            <li><Link to="/catalog?category=wedding">{t(locale, 'wedding')}</Link></li>
            <li><Link to="/catalog?category=engagement">{t(locale, 'engagement')}</Link></li>
            <li><Link to="/catalog?category=evening">{t(locale, 'evening')}</Link></li>
            <li><Link to="/catalog?mode=rental">{t(locale, 'rent')}</Link></li>
            <li><Link to="/catalog?mode=sale">{t(locale, 'shop')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading text-champagne mb-3">{t(locale, 'contact')}</h4>
          <ul className="space-y-2 text-sm text-ivory/80">
            <li><WhatsAppButton payload={{ to: WA_NUMBER, productName: 'AL AGGAD', productCode: 'GENERAL', intent: 'general', lang: locale }}><span className="underline underline-offset-4">WhatsApp</span></WhatsAppButton></li>
            <li><Link to="/contact">{t(locale, 'contact')}</Link></li>
            <li><Link to="/faq">{t(locale, 'faq_title')}</Link></li>
            <li><Link to="/about">{t(locale, 'about')}</Link></li>
            <li><Link to="/policies#rental">{t(locale, 'rental_policy')}</Link></li>
            <li><Link to="/policies#sale">{t(locale, 'sale_policy')}</Link></li>
            <li><Link to="/policies#privacy">{t(locale, 'privacy')}</Link></li>
            <li><Link to="/policies#terms">{t(locale, 'terms')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading text-champagne mb-3">AL AGGAD</h4>
          <p className="text-sm text-ivory/70" dir="ltr">
            <a href={siteConfig.instagram} className="underline underline-offset-4">Instagram</a>
            {' · '}<a href={siteConfig.facebook} className="underline underline-offset-4">Facebook</a>
            {' · '}<a href={siteConfig.tiktok} className="underline underline-offset-4">TikTok</a>
          </p>
          <p className="text-xs text-ivory/50 mt-2">{locale === 'ar' ? siteConfig.addressAr : siteConfig.addressEn}</p>
        </div>
      </div>
      <div className="border-t border-ivory/15 text-center text-xs py-4 text-ivory/60">
        © {new Date().getFullYear()} {locale === 'ar' ? 'العقاد' : 'AL AGGAD'} — {t(locale, 'footer_rights')}
      </div>
    </footer>
  );
}
