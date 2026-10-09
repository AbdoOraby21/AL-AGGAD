# Brand logo assets — AL AGGAD | العقاد

The website displays the **supplied custom logo image** (never re-typeset text).
Save the artwork files with these exact names — the **preferred** location is
checked first:

| File (preferred) | Fallback | Ink | Used on |
|---|---|---|---|
| `public/images/al-aggad-logo.png` | `public/brand/al-aggad-logo.png` | dark-brown / olive (as supplied) | Header and all light surfaces |
| `public/images/al-aggad-logo-light.png` | `public/brand/al-aggad-logo-light.png` | champagne / ivory | Footer and dark surfaces |

Guidelines:
- Export PNG with transparent background (SVG also accepted — keep the same names with `.svg` extension and update `src/lib/brand.ts`).
- Keep the original Arabic lettering, proportions, and spacing — do not stretch; the site constrains height only (`h-12`/`h-14`, width auto).
- Recommended height: ≥ 240px for retina sharpness on mobile and desktop.
- Until the files are present, the site renders a clearly-marked typographic fallback automatically; adding the files needs **no code change**.
