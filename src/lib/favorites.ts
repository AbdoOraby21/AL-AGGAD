/** Device-local favorites (wishlist), shared by cards, details, and compare. */
const FAV_KEY = 'aggad-favs';

export function getFavIds(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
export function isFav(id: string): boolean {
  return getFavIds().includes(id);
}
export function toggleFavId(id: string): boolean {
  const ids = getFavIds();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  return next.includes(id);
}
