import { buildApiUrl, defaultHeaders } from './api';

/**
 * Auth utility helpers
 */

const TOKEN_KEY  = 'ibik_auth_token';
const USER_KEY   = 'ibik_auth_user';

/** Simpan token dan data user setelah login */
export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('auth_changed'));
}

/** Ambil token dari localStorage */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Ambil data user dari localStorage */
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Cek apakah user sudah login */
export function isAuthenticated() {
  return !!getToken();
}

/** Hapus sesi (logout lokal) */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('auth_changed'));
}

/** Logout ke server + bersihkan lokal */
export async function logout() {
  window.dispatchEvent(new Event('logging_out'));
  const token = getToken();
  if (token) {
    try {
      await fetch(buildApiUrl('/api/logout'), {
        method:  'POST',
        headers: {
          ...defaultHeaders,
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch {
      // Tetap bersihkan lokal meski request gagal
    }
  }
  clearAuth();
}

/** Header Authorization untuk fetch requests */
export function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
