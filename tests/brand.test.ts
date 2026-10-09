import { describe, it, expect } from 'vitest';
import { LOGO_SRC, LOGO_DARK_BG_SRC, LOGO_ALT, LOGO_SOURCES, LOGO_DARK_SOURCES, LOGO_PREFERRED_SRC } from '../src/lib/brand';

describe('brand logo assets', () => {
  it('uses clearly named placeholder paths under public/brand', () => {
    expect(LOGO_SRC).toBe('/brand/al-aggad-logo.png');
    expect(LOGO_DARK_BG_SRC).toBe('/brand/al-aggad-logo-light.png');
  });
  it('light variant differs from the default (dark-background safe)', () => {
    expect(LOGO_DARK_BG_SRC).not.toBe(LOGO_SRC);
  });
  it('carries the required descriptive alt text', () => {
    expect(LOGO_ALT).toBe('العقاد — AL AGGAD');
  });
  it('prefers the owner-supplied public/images path, falling back to public/brand', () => {
    expect(LOGO_PREFERRED_SRC).toBe('/images/al-aggad-logo.png');
    expect(LOGO_SOURCES[0]).toBe(LOGO_PREFERRED_SRC);
    expect(LOGO_SOURCES).toContain(LOGO_SRC);
    expect(LOGO_DARK_SOURCES).toContain(LOGO_DARK_BG_SRC);
  });
});
