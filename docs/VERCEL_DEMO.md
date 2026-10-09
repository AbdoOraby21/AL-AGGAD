# Vercel Demo Deployment — AL AGGAD | العقاد

Client-facing demo of the bridal boutique. Demo mode is a **UI-level showcase
flag only** — it is not access control and never touches production data.

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Demo value | Notes |
|---|---|---|
| `VITE_DEMO_MODE` | `true` | Enables the safe mock demo. **All `VITE_*` vars are public** — never put secrets here. |
| `VITE_WHATSAPP_NUMBER` | `201000000000` (or the boutique number) | Displayed only; in demo mode WhatsApp buttons show a message **preview**, never open `wa.me`. |
| `VITE_SUPABASE_URL` | _(leave unset for a fully offline demo)_ | Optional: set it and the demo still never writes — the demo branch returns before any Supabase call (covered by automated tests). |
| `VITE_SUPABASE_ANON_KEY` | _(leave unset for a fully offline demo)_ | Same as above. Never use a service-role key in any `VITE_*` variable. |

Apply to **Production** (and Preview if you want demo previews). Redeploy after changing.

## 2. Connect the GitHub repository

1. Push `D:\العقاد` to GitHub (`gh repo create al-aggad-bridal --private --source=. --push`, or push to the existing repo).
2. Vercel → **Add New → Project → Import** the repository.
3. Framework preset: **Vite**. The repo's `vercel.json` already sets:
   - Build command: `npm run build` (`tsc -b && vite build`)
   - Output directory: `dist`
   - Rewrites: `/(.*)` → `/index.html` — this is what makes **direct navigation and
     refresh work on nested routes** (`/admin`, `/admin/bookings`, `/dress/AG-W-001`, `/catalog?...`).

## 3. Build & deploy

- Vercel builds automatically on every push to the connected branch.
- Manual: `vercel --prod` from the project root (or **Deployments → Redeploy**).
- Local verification before pushing:
  ```powershell
  npm test            # 28 tests incl. demo-safety suite
  npm run typecheck
  $env:VITE_DEMO_MODE='true'; npm run build   # demo-mode production build
  npx vite preview --port 5199                # open http://localhost:5199/
  ```

## 4. Verify the demo deployment

1. Gold **“DEMO VERSION — نسخة تجريبية”** banner visible on every page (AR + EN).
2. Catalog cards carry a **SAMPLE / عينة تجريبية** badge.
3. Submit a checkout and a rental request → references look like `DEMO-AG-S-…` with an explicit “nothing was booked / no payment taken” note.
4. WhatsApp buttons open an in-app **message preview**, not `wa.me`.
5. `/admin/login` shows **“Enter demo dashboard”** → dashboard metrics, sample bookings/orders/dresses editable locally; refresh keeps them local, nothing leaves the browser.
6. Direct-open (paste URL, then refresh): `/`, `/catalog?category=wedding`, `/dress/AG-W-001`, `/admin`, `/admin/bookings` — all must render (proves the SPA rewrite works).
7. Switch AR ⇄ EN — layout flips RTL ⇄ LTR everywhere including the demo banner and preview modal.

## 5. Disable demo for the real production release

1. Vercel → Environment Variables → set `VITE_DEMO_MODE` to `false` (or delete it; missing flag = production behavior).
2. Set the real `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WHATSAPP_NUMBER`.
3. **Redeploy** (env changes require a new build).
4. Verify the banner is gone, `/admin` requires real login, and orders/bookings write to Supabase.

## 6. Limitations of this demo (do not present otherwise)

- No real availability guarantees: the demo catalog/booking checks are illustrative; the production overlap guard lives in the `confirm_booking()` SQL transaction.
- No payments, no real WhatsApp delivery, no email/newsletter backend.
- Demo records live in the visitor's browser only and are invisible to staff.
- `VITE_DEMO_MODE` must never be relied on as a security boundary; production RLS + Supabase Auth remain the real protections.
