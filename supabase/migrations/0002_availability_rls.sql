-- 0002_availability.sql — overlap guard + transactional confirm + RLS
-- Principle: frontend checks are UX only. The confirm path locks overlapping
-- rows and aborts on conflict, so concurrent confirms cannot double-book.

-- Helper: does a blocking booking overlap (with buffers)?
create or replace function public.booking_overlaps(
  p_unit uuid, p_start date, p_end date, p_exclude uuid default null,
  p_pickup_buffer int default 1, p_return_buffer int default 1
) returns boolean
language sql stable as $$
  select exists (
    select 1 from public.rental_bookings b
    where b.unit_id = p_unit
      and b.status in ('confirmed','ready_for_pickup','checked_out','inspection','cleaning')
      and (p_exclude is null or b.id <> p_exclude)
      and (p_start - p_pickup_buffer) <= b.end_date
      and b.start_date <= (p_end + p_return_buffer)
  );
$$;

-- Transactional confirm: rechecks availability under lock. Call from admin.
create or replace function public.confirm_booking(p_booking_id uuid)
returns void
language plpgsql security definer as $$
declare
  v record;
  v_pickup int := 1;
  v_return int := 1;
begin
  select * into v from public.rental_bookings where id = p_booking_id for update;
  if not found then raise exception 'booking not found'; end if;
  if v.status <> 'pending_review' then raise exception 'only pending bookings can be confirmed'; end if;
  if v.unit_id is null then raise exception 'assign a physical unit before confirming'; end if;

  select coalesce(pickup_buffer_days,1), coalesce(return_buffer_days,1)
    into v_pickup, v_return from public.business_settings where id = 1;

  -- lock sibling rows on the same unit to serialize concurrent confirms
  perform 1 from public.rental_bookings
    where unit_id = v.unit_id and id <> v.id for update;

  if public.booking_overlaps(v.unit_id, v.start_date, v.end_date, v.id, v_pickup, v_return) then
    raise exception 'unit is already booked for these dates';
  end if;

  update public.rental_bookings
    set status = 'confirmed', updated_at = now()
    where id = p_booking_id;

  update public.dress_units set status = 'reserved', updated_at = now()
    where id = v.unit_id;

  insert into public.rental_events(booking_id, from_status, to_status, note)
    values (p_booking_id, 'pending_review', 'confirmed', 'confirmed via admin');
end;
$$;

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.dresses enable row level security;
alter table public.dress_images enable row level security;
alter table public.dress_units enable row level security;
alter table public.customers enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.rental_bookings enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.rental_events enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.business_settings enable row level security;
alter table public.audit_logs enable row level security;

-- staff check (used by policies; SECURITY DEFINER to avoid recursion)
create or replace function public.is_staff() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('owner','admin','staff'));
$$;
create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('owner','admin'));
$$;

-- Public catalog: read active dresses + images only
drop policy if exists "public read active dresses" on public.dresses;
create policy "public read active dresses" on public.dresses for select using (is_active = true);
drop policy if exists "public read images" on public.dress_images;
create policy "public read images" on public.dress_images for select using (true);
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
drop policy if exists "public read settings" on public.business_settings;
create policy "public read settings" on public.business_settings for select using (true);

-- Public can INSERT sale orders / rental bookings (validated server-side by types/checks);
-- they can never read others' rows (no select policy for anon).
drop policy if exists "anon insert orders" on public.sales_orders;
create policy "anon insert orders" on public.sales_orders for insert with check (true);
drop policy if exists "anon insert order items" on public.sales_order_items;
create policy "anon insert order items" on public.sales_order_items for insert with check (true);
drop policy if exists "anon insert bookings" on public.rental_bookings;
create policy "anon insert bookings" on public.rental_bookings for insert with check (status = 'pending_review');

-- Staff: full access to operational tables
-- (representative policies; repeat pattern per table)
drop policy if exists "staff all dresses" on public.dresses;
create policy "staff all dresses" on public.dresses for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff all images" on public.dress_images;
create policy "staff all images" on public.dress_images for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff all units" on public.dress_units;
create policy "staff all units" on public.dress_units for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff all orders" on public.sales_orders;
create policy "staff all orders" on public.sales_orders for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff all order items" on public.sales_order_items;
create policy "staff all order items" on public.sales_order_items for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff all bookings" on public.rental_bookings;
create policy "staff all bookings" on public.rental_bookings for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff all customers" on public.customers;
create policy "staff all customers" on public.customers for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff all payments" on public.payments;
create policy "staff all payments" on public.payments for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff all refunds" on public.refunds;
create policy "staff all refunds" on public.refunds for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff all events" on public.rental_events;
create policy "staff all events" on public.rental_events for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff all maintenance" on public.maintenance_records;
create policy "staff all maintenance" on public.maintenance_records for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff all categories" on public.categories;
create policy "staff all categories" on public.categories for all using (public.is_staff()) with check (public.is_staff());

-- Admins only: roles, settings writes, audit
drop policy if exists "admin all roles" on public.user_roles;
create policy "admin all roles" on public.user_roles for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "staff read settings" on public.business_settings;
create policy "staff read settings" on public.business_settings for select using (public.is_staff());
drop policy if exists "admin write settings" on public.business_settings;
create policy "admin write settings" on public.business_settings for insert with check (public.is_admin());
drop policy if exists "admin update settings" on public.business_settings;
create policy "admin update settings" on public.business_settings for update using (public.is_admin());
drop policy if exists "staff read audit" on public.audit_logs;
create policy "staff read audit" on public.audit_logs for select using (public.is_staff());

-- Storage: public read, staff write on dress-images bucket (create bucket in dashboard or via seed)
-- insert via SQL is not allowed for storage.buckets in all versions; run in dashboard:
--   Storage → New bucket → id "dress-images", Public ON.
-- Then apply these policies in the storage schema (documented here for setup):
--   create policy "public read dress images" on storage.objects for select using (bucket_id = 'dress-images');
--   create policy "staff upload dress images" on storage.objects for insert with check (bucket_id = 'dress-images' and public.is_staff());
--   create policy "staff update dress images" on storage.objects for update using (bucket_id = 'dress-images' and public.is_staff());
--   create policy "staff delete dress images" on storage.objects for delete using (bucket_id = 'dress-images' and public.is_staff());
