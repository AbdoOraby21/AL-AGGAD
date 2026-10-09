-- 0003_seed.sql — categories + settings row only. NO demo dresses in production.
insert into public.categories (slug, name_ar, name_en, sort) values
  ('wedding','فساتين الزفاف','Wedding Dresses',1),
  ('engagement','فساتين الخطوبة','Engagement Dresses',2)
on conflict (slug) do nothing;

insert into public.business_settings (id, boutique_name_ar, boutique_name_en, currency, payment_methods, announcement_ar, announcement_en) values
  (1,'العقاد','AL AGGAD','EGP','{store,cod}','تأجير وبيع فساتين الزفاف والخطوبة — احجزي موعدك عبر واتساب','Wedding & engagement dress sale and rental — book via WhatsApp')
on conflict (id) do nothing;
