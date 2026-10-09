import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Shirt, CalendarClock, Receipt, Users, Settings as SettingsIcon, LogOut, ArrowLeft, BarChart3 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { isDemoMode, resolveAdminAccess } from '../../lib/demo';
import { useLang } from '../../app/LanguageContext';
import { t } from '../../lib/i18n';
import { Logo } from '../../components/Logo';

export function AdminLogin() {
  const { locale } = useLang();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!isSupabaseConfigured) { nav('/admin'); return; } // offline demo passthrough
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErr(error.message); return; }
    nav('/admin');
  };

  return (
    <main className="min-h-[70vh] grid place-items-center px-4 py-12">
      <form onSubmit={login} className="w-full max-w-sm bg-white border border-champagne rounded-3xl p-8">
        <Logo compact />
        <h1 className="font-heading text-2xl mt-3">{t(locale, 'admin')}</h1>
        {isDemoMode() && (
          <div className="mt-4 space-y-2">
            <button type="button" onClick={() => nav('/admin')}
              className="w-full bg-gold text-white rounded-full py-2.5 text-sm hover:bg-gold-deep">
              {t(locale, 'demo_enter')}
            </button>
            <p className="text-xs bg-gold/15 border border-gold/40 rounded-xl p-3">{t(locale, 'demo_auth_note')}</p>
          </div>
        )}
        <label className="block text-sm mt-4" dir="ltr">Email<input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        <label className="block text-sm mt-3" dir="ltr">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border border-champagne rounded-xl px-3 py-2" /></label>
        {err && <p className="text-red-700 text-sm mt-2">{err}</p>}
        <button className="mt-4 w-full bg-cocoa text-ivory rounded-full py-2.5">→</button>
        {!isSupabaseConfigured && <p className="text-xs text-stone-soft mt-2">Offline demo mode — any credentials preview the dashboard.</p>}
      </form>
    </main>
  );
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const [ready, setReady] = useState(() => {
    // Demo entry is explicit and local-only; production auth below is untouched.
    const access = resolveAdminAccess({ demo: isDemoMode(), offline: !isSupabaseConfigured, hasSession: false });
    return access === 'demo' || access === 'passthrough';
  });
  useEffect(() => {
    if (isDemoMode() || !isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => {
      const access = resolveAdminAccess({ demo: false, offline: false, hasSession: !!data.session });
      if (access !== 'granted') nav('/admin/login', { replace: true });
      else setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e: string, s: unknown) => {
      if (!s) nav('/admin/login', { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);
  if (!ready) return <main className="p-10 text-center text-stone-soft">…</main>;
  return <>{children}</>;
}

export function AdminShell() {
  const { locale } = useLang();
  const loc = useLocation();
  const nav = useNavigate();
  const items = [
    ['/admin', t(locale, 'dashboard'), <LayoutDashboard size={17} key="d" />],
    ['/admin/dresses', t(locale, 'dresses'), <Shirt size={17} key="s" />],
    ['/admin/bookings', t(locale, 'bookings'), <CalendarClock size={17} key="b" />],
    ['/admin/orders', t(locale, 'orders'), <Receipt size={17} key="o" />],
    ['/admin/customers', t(locale, 'customers'), <Users size={17} key="c" />],
    ['/admin/reports', t(locale, 'reports'), <BarChart3 size={17} key="r" />],
    ['/admin/settings', t(locale, 'settings'), <SettingsIcon size={17} key="st" />],
  ] as const;
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
      <aside className="md:w-60 shrink-0 bg-white border border-champagne rounded-3xl p-4 h-fit md:sticky md:top-28">
        <Logo compact />
        <nav className="mt-4 space-y-1">
          {items.map(([to, label, icon]) => (
            <Link key={to} to={to} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${loc.pathname === to ? 'bg-cocoa text-ivory' : 'hover:bg-champagne/50'}`}>
              {icon} {label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 pt-4 border-t border-champagne flex gap-2">
          <Link to="/" className="flex-1 text-xs border border-champagne rounded-full px-3 py-2 text-center flex items-center justify-center gap-1"><ArrowLeft size={13} /> {t(locale, 'home')}</Link>
          <button onClick={async () => { if (isSupabaseConfigured) await supabase.auth.signOut(); nav('/'); }} className="flex-1 text-xs border border-champagne rounded-full px-3 py-2 flex items-center justify-center gap-1"><LogOut size={13} /> {locale === 'ar' ? 'خروج' : 'Logout'}</button>
        </div>
      </aside>
      <section className="flex-1 min-w-0"><Outlet /></section>
    </div>
  );
}
