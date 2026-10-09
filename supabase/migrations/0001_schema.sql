-- 0001_schema.sql — AL AGGAD core schema
-- UUID PKs, minor-unit money, price snapshots, timestamps.

create extension if not exists "pgcrypto";

-- Staff roles (app-level RBAC; service role / RLS enforce it)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','staff')),
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null,
  name_en text not null,
  sort int default 0
);

create table if not exists public.dresses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  category_slug text not null default 'wedding',
  style text,
  fabric text,
  sizes text[] default '{}',
  colors text[] default '{}',
  sale_enabled boolean default true,
  sale_price_minor int,
  rental_enabled boolean default true,
  rental_price_minor int,
  deposit_minor int,
  booking_deposit_minor int,
  is_featured boolean default false,
  is_new boolean default false,
  is_active boolean default true,
  is_sold boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_dresses_cat on public.dresses(category_slug, is_active);
create index if not exists idx_dresses_flags on public.dresses(is_featured, is_new);

create table if not exists public.dress_images (
  id uuid primary key default gen_random_uuid(),
  dress_id uuid not null references public.dresses(id) on delete cascade,
  url text not null,
  alt text,
  sort int default 0,
  is_primary boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_images_dress on public.dress_images(dress_id, sort);

create table if not exists public.dress_units (
  id uuid primary key default gen_random_uuid(),
  dress_id uuid not null references public.dresses(id) on delete cascade,
  code text unique not null,
  size_label text,
  color_label text,
  condition text default 'excellent' check (condition in ('excellent','good','needs_repair','retired')),
  status text default 'available' check (status in ('available','reserved','checked_out','inspection','cleaning','maintenance','sold','inactive')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_units_dress on public.dress_units(dress_id, status);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_customers_phone on public.customers(phone);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  customer_id uuid references public.customers(id),
  customer_name text not null,
  customer_phone text not null,
  customer_notes text,
  total_minor int not null default 0,
  currency text not null default 'EGP',
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','fulfilled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','partial','paid','refunded','partially_refunded')),
  fulfillment_status text not null default 'pending' check (fulfillment_status in ('pending','ready','delivered','cancelled')),
  fulfillment_method text not null default 'store_pickup',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.sales_orders(id) on delete cascade,
  dress_id uuid references public.dresses(id),
  dress_code text not null,
  name_snapshot text not null,
  size_label text,
  color_label text,
  unit_price_minor int not null,
  quantity int not null default 1
);

create table if not exists public.rental_bookings (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  dress_id uuid not null references public.dresses(id),
  unit_id uuid references public.dress_units(id),
  customer_id uuid references public.customers(id),
  customer_name text not null,
  customer_phone text not null,
  occasion_date date,
  start_date date not null,
  end_date date not null,
  size_label text,
  color_label text,
  rental_fee_minor int not null default 0,
  booking_deposit_minor int not null default 0,
  security_deposit_minor int not null default 0,
  discount_minor int not null default 0,
  extra_charges_minor int not null default 0,
  late_fee_minor int not null default 0,
  damage_charge_minor int not null default 0,
  currency text not null default 'EGP',
  status text not null default 'pending_review' check (status in ('pending_review','confirmed','ready_for_pickup','checked_out','returned','inspection','cleaning','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','partial','paid','refunded','partially_refunded')),
  terms_snapshot text,
  idempotency_key text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint chk_dates check (start_date <= end_date)
);
create index if not exists idx_bookings_unit_dates on public.rental_bookings(unit_id, status, start_date, end_date);
create index if not exists idx_bookings_dress on public.rental_bookings(dress_id, status);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('sale','rental')),
  ref_id uuid not null,
  amount_minor int not null,
  currency text default 'EGP',
  method text not null,
  provider_ref text,
  verified boolean default false,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('sale','rental')),
  ref_id uuid not null,
  amount_minor int not null,
  reason text,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.rental_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.rental_bookings(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.dress_units(id) on delete cascade,
  kind text not null check (kind in ('cleaning','repair','inspection')),
  start_date date not null,
  end_date date not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.business_settings (
  id int primary key,
  boutique_name_ar text default 'العقاد',
  boutique_name_en text default 'AL AGGAD',
  whatsapp_number text default '',
  phone text default '',
  address_ar text default '',
  address_en text default '',
  hours_ar text default '',
  hours_en text default '',
  currency text default 'EGP',
  min_rental_days int default 3,
  pickup_buffer_days int default 1,
  return_buffer_days int default 1,
  late_fee_per_day_minor int default 0,
  payment_methods text[] default '{store,cod}',
  instagram_url text default '',
  facebook_url text default '',
  tiktok_url text default '',
  map_url text default '',
  announcement_ar text default '',
  announcement_en text default '',
  updated_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb,
  created_at timestamptz default now()
);
