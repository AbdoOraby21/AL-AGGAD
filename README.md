# العقاد | AL AGGAD — Luxury Bridal Boutique

Bilingual (AR RTL / EN LTR) boutique for **wedding & engagement dress sale + rental**: public catalog, checkout, rental reservations with overlap-safe confirmation, WhatsApp inquiries, and a role-based admin dashboard. React + Vite + TypeScript + Tailwind + React Router + Supabase.

## 1. Prerequisites

- Node 20+, npm, Git, a Supabase project, a Vercel account.
- Business WhatsApp number in international digits (e.g. `2010XXXXXXXX`).

## 2. Local setup

```bash
git clone <your-repo-url>
cd al-aggad-bridal
npm install
cp .env.example .env   # Windows: copy .env.example .env
# edit .env with your Supabase URL + anon key + WhatsApp number
npm run dev             # http://localhost:5173
```

Without Supabase keys the app boots in **offline preview mode** with a small local catalog so UI can be reviewed; orders/bookings get a local reference and are stored for real once Supabase is configured. Never use preview data in production.

## 3. Supabase setup

1. Create project → copy **Project URL** and **anon public key** into `.env`.
2. **SQL Editor → run in order**: `supabase/migrations/0001_schema.sql`, `0002_availability_rls.sql`, `0003_seed.sql`.
3. **Storage**: create public bucket `dress-images` (Storage → New bucket → Public ON). Apply the storage policies documented at the bottom of `0002_availability_rls.sql`.
4. **Auth → Users → Invite**: create the owner account, then grant role:
   ```sql
   insert into public.profiles (id, email) values ('<auth-user-uuid>', 'owner@example.com');
   insert into public.user_roles (user_id, role) values ('<auth-user-uuid>', 'owner');
   ```
   Log in at `/admin/login`. Manage further staff in `user_roles` (`owner` > `admin` > `staff`).
5. **Admin → Settings**: set boutique name, WhatsApp, currency (default EGP), buffers, late-fee, payment methods.

### Security boundaries

- Browser uses the **anon key only**. Service-role key stays server-side (never in `VITE_*`).
- RLS: public can read active catalog + insert orders/bookings as `pending`; staff (`is_staff()`) operate; admins (`is_admin()`) manage roles/settings.
- Booking confirmation runs via `confirm_booking()` (SECURITY DEFINER, row locks, overlap recheck). Client checks are UX only.
- Payments: pay-at-store / COD now; online payments only after a provider webhook marks `payments.verified = true` server-side. Never trust browser redirects.
- Image uploads: staff-only, ≤5MB, jpg/png/webp.

## 4. Brand / logo & fonts

**Logo:** the custom العقاد artwork is rendered as an image (`<Logo>` in `src/components/Logo.tsx`, paths in `src/lib/brand.ts`), never as text — in the header, footer, hero, about page, and admin.
Save the supplied files as `public/brand/al-aggad-logo.png` (dark-brown/olive ink, transparent — light surfaces) and `public/brand/al-aggad-logo-light.png` (champagne/ivory ink, transparent — dark surfaces). Until present, a marked typographic fallback renders; adding the files needs no code change. Alt text everywhere: “العقاد — AL AGGAD”. See `public/brand/README.md`.
Wordmark: **العقاد / AL AGGAD**. Headline font for Arabic display is `Aref Ruqaa` (legal Google Font with a Thuluth feel); body `Tajawal/Cairo`; English headings `Cormorant Garamond`, body `Inter`.
The owner-provided reference `arfonts-decotype-thuluth-iii/decotype-thuluth-iii.ttf` ships with an **unclear license** (see its `about_this_font.txt`), so it is kept as reference only and NOT bundled. If the owner holds a license, place `public/fonts/aggad-thuluth.woff2` and uncomment the `@font-face` in `src/index.css`.

## 5. Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | local dev |
| `npm run typecheck` / `npm run build` | verify + production build |
| `npm test` | critical-rule tests (availability, money, WhatsApp) |

## 6. Deploy to Vercel

1. Push to GitHub. **Vercel → New Project → Import**.
2. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
3. Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WHATSAPP_NUMBER`.
4. Deploy → add custom domain → in Supabase **Auth → URL Configuration** set Site URL to the Vercel domain.

### Client demo mode

Set `VITE_DEMO_MODE=true` for a safe showcase: sample catalog with SAMPLE badges,
persistent demo banner with one-click reset, local-only checkout/booking records
(`DEMO-ORD-0001` / `DEMO-BOOK-0001`), multi-step rental flow with simulated
availability calendar and conflict checks, WhatsApp message previews instead of
`wa.me` links, favorites with comparison, demo promo codes (try `DEMO10`), and a
credential-free demo admin dashboard (charts, units, promos, CSV reports) backed
by browser storage. Production auth, RLS, and write paths are untouched when the
flag is off. Full checklist: **`docs/VERCEL_DEMO.md`**.

## 7. Operations

- **Backup**: Supabase → Database → Backups (daily on paid plans; also `pg_dump` before big changes). Storage: version/replicate `dress-images`.
- **Rental lifecycle**: pending_review → confirmed (overlap-checked) → ready_for_pickup → checked_out → returned → inspection → cleaning → available/completed; maintenance windows block booking.
- **Sold dresses**: `is_sold = true` hides from catalog; units → `sold`.
- **Monitoring**: review `audit_logs`, pending bookings, upcoming returns (dashboard), failed logins.

## 8. QA checklist (must pass)

RTL/LTR switch · catalog search/filter · dress create/edit · multi-image upload · sale order · rental request · conflicting dates rejected · buffers respected · sold-out hidden · cleaning blocks · confirm/cancel flows · payment/refund states · RBAC (anon blocked from `/admin` data) · WhatsApp URL content · mobile layout · validation · empty DB · network errors · refresh persistence.
