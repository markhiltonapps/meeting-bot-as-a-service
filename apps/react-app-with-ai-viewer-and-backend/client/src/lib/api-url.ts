/**
 * Where the Express API lives.
 *
 * Empty (the default) keeps every call same-origin, which is what the Vite dev
 * proxy and the single-box deployment expect. Set VITE_API_BASE_URL to the
 * API's origin when the client is hosted separately, e.g. on Vercel.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
