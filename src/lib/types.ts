// Central domain types. Money is stored as integer minor units (e.g. piastres/cents)
// with an explicit currency code. Never use floats for money.

export type Locale = 'ar' | 'en';
export type CategorySlug = 'wedding' | 'engagement';
export type ModeFilter = 'all' | 'sale' | 'rental';

export interface Category {
  id: string;
  slug: CategorySlug | string;
  name_ar: string;
  name_en: string;
}

export interface DressImage {
  id: string;
  dress_id: string;
  url: string;
  alt?: string | null;
  sort: number;
  is_primary: boolean;
}

export interface DressUnit {
  id: string;
  dress_id: string;
  code: string; // e.g. AG-101-A
  size_label: string | null;
  color_label: string | null;
  condition: 'excellent' | 'good' | 'needs_repair' | 'retired';
  status: 'available' | 'reserved' | 'checked_out' | 'inspection' | 'cleaning' | 'maintenance' | 'sold' | 'inactive';
  notes?: string | null;
}

export interface Dress {
  id: string;
  code: string; // unique product code, e.g. AG-W-001
  name_ar: string;
  name_en: string;
  description_ar?: string | null;
  description_en?: string | null;
  category_slug: string;
  style?: string | null;
  fabric?: string | null;
  sizes: string[];
  colors: string[];
  sale_enabled: boolean;
  sale_price_minor: number | null;
  rental_enabled: boolean;
  rental_price_minor: number | null;
  deposit_minor: number | null; // refundable security deposit
  booking_deposit_minor: number | null; // non-refundable booking deposit
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  is_sold: boolean;
  /** Set on sample records shown in demo mode (never on production rows). */
  demoSample?: boolean;
  created_at: string;
  updated_at: string;
  images?: DressImage[];
  units?: DressUnit[];
}

export type SaleOrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'fulfilled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded' | 'partially_refunded';
export type FulfillmentStatus = 'pending' | 'ready' | 'delivered' | 'cancelled';

export interface SalesOrder {
  id: string;
  reference: string; // e.g. AG-S-2026-0001
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_notes?: string | null;
  total_minor: number;
  currency: string;
  status: SaleOrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  fulfillment_method: 'store_pickup' | 'cod' | 'online';
  items: SalesOrderItem[];
  created_at: string;
}

export interface SalesOrderItem {
  id: string;
  dress_id: string;
  dress_code: string;
  name_snapshot: string;
  size_label?: string | null;
  color_label?: string | null;
  unit_price_minor: number;
  quantity: number;
}

export type BookingStatus =
  | 'pending_review' | 'confirmed' | 'ready_for_pickup'
  | 'checked_out' | 'returned' | 'inspection'
  | 'cleaning' | 'completed' | 'cancelled';

export interface RentalBooking {
  id: string;
  reference: string; // AG-R-2026-0001
  dress_id: string;
  unit_id: string | null;
  customer_name: string;
  customer_phone: string;
  occasion_date: string | null;
  start_date: string; // rental start (pickup)
  end_date: string;   // expected return
  size_label?: string | null;
  color_label?: string | null;
  rental_fee_minor: number;
  booking_deposit_minor: number;
  security_deposit_minor: number;
  discount_minor: number;
  extra_charges_minor: number;
  late_fee_minor: number;
  damage_charge_minor: number;
  currency: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  // price snapshot note
  terms_snapshot?: string | null;
  created_at: string;
}

export interface BusinessSettings {
  boutique_name_ar: string;
  boutique_name_en: string;
  whatsapp_number: string; // E.164 without '+', e.g. 2010XXXXXXXX
  phone: string;
  address_ar: string;
  address_en: string;
  hours_ar: string;
  hours_en: string;
  currency: string; // e.g. EGP
  locale_default: Locale;
  min_rental_days: number;
  pickup_buffer_days: number;
  return_buffer_days: number;
  late_fee_per_day_minor: number;
  payment_methods: Array<'store' | 'cod' | 'online'>;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  map_url: string;
  announcement_ar: string;
  announcement_en: string;
}

export const BOOKING_STATUSES: BookingStatus[] = [
  'pending_review', 'confirmed', 'ready_for_pickup', 'checked_out',
  'returned', 'inspection', 'cleaning', 'completed', 'cancelled',
];

/** Bookings in these states block a unit's calendar (inclusive, with buffers applied by caller). */
export const BLOCKING_BOOKING_STATUSES: BookingStatus[] = [
  'confirmed', 'ready_for_pickup', 'checked_out', 'inspection', 'cleaning',
];
