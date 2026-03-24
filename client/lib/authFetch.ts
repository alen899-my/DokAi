/**
 * authFetch — a drop-in replacement for fetch() that:
 *  1. Automatically attaches the Bearer token from localStorage
 *  2. On 401 (expired token), attempts a silent token refresh and retries once
 *  3. On refresh failure, clears auth state and redirects to /login
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

async function tryRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const newAccessToken = data?.data?.tokens?.accessToken;
    const newRefreshToken = data?.data?.tokens?.refreshToken;

    if (newAccessToken) {
      localStorage.setItem("accessToken", newAccessToken);
      if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
      return newAccessToken;
    }
    return null;
  } catch {
    return null;
  }
}

function clearAuthAndRedirect() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = localStorage.getItem("accessToken");

  const buildHeaders = (t: string | null): HeadersInit => ({
    ...(options.headers as Record<string, string> || {}),
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  });

  // First attempt
  let res = await fetch(url, { ...options, headers: buildHeaders(token) });

  // If 401 — try to refresh and retry once
  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      res = await fetch(url, { ...options, headers: buildHeaders(newToken) });
    } else {
      clearAuthAndRedirect();
    }
  }

  return res;
}

/** Helper to build a full API URL */
export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}
