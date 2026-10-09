/** Single source of truth for brand-logo assets.
 *  The custom العقاد logo is used as an image everywhere — never re-typeset.
 *  Preferred owner-supplied location (tried first):
 *    public/images/al-aggad-logo.png        (dark-brown/olive ink, transparent bg — header, light surfaces)
 *    public/images/al-aggad-logo-light.png  (champagne/ivory ink, transparent bg — footer, dark surfaces)
 *  Existing canonical location (tried second, kept for compatibility):
 *    public/brand/al-aggad-logo.png
 *    public/brand/al-aggad-logo-light.png
 *  The <Logo> component walks these lists and falls back to a marked
 *  typographic placeholder only when no file exists. No fake asset is
 *  generated — save the real supplied artwork at one of the paths above.
 */
export const LOGO_SRC = '/brand/al-aggad-logo.png';
export const LOGO_DARK_BG_SRC = '/brand/al-aggad-logo-light.png';
export const LOGO_PREFERRED_SRC = '/images/al-aggad-logo.png';
export const LOGO_PREFERRED_DARK_SRC = '/images/al-aggad-logo-light.png';
export const LOGO_SOURCES = [LOGO_PREFERRED_SRC, LOGO_SRC];
export const LOGO_DARK_SOURCES = [LOGO_PREFERRED_DARK_SRC, LOGO_DARK_BG_SRC];
export const LOGO_ALT = 'العقاد — AL AGGAD';
