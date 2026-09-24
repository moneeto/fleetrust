/**
 * Cliente HTTP para usar desde componentes cliente. Llama a rutas
 * relativas de ESTE mismo front (nunca a la API de `admin`, AD1); Next.js
 * las reenvía server-side a la API real (ver `rewrites()` en
 * `next.config.mjs`), así la cookie de sesión queda en el mismo origen que
 * ve el navegador. Para componentes de servidor, usar `lib/server-api.ts`.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, body.code ?? 'unknown', body.message ?? 'Error desconocido');
  }

  return body as T;
}

export interface MeResponse {
  idUser: number;
  email: string;
  name: string | null;
  surname: string | null;
  locale: string | null;
  accountStatus: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  modoSuplantacion: boolean;
  mustChangePassword: boolean;
}

export interface NavigationItem {
  moduleCode: string;
  moduleI18nKey: string;
  icon: string | null;
  path: string;
  i18nKey: string;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ readOnly: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),

  acceptInvitation: (token: string, password: string) =>
    request<void>('/api/auth/accept-invitation', { method: 'POST', body: JSON.stringify({ token, password }) }),

  resetPassword: (token: string, password: string) =>
    request<void>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),

  verifyEmail: (token: string) =>
    request<void>('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),

  changePassword: (currentPassword: string, nextPassword: string) =>
    request<void>('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, nextPassword }) }),

  impersonate: (codigo: string) =>
    request<void>('/api/auth/impersonate', { method: 'POST', body: JSON.stringify({ codigo }) }),

  me: () => request<MeResponse>('/api/me'),

  updateMe: (data: { name?: string; locale?: string }) =>
    request<void>('/api/me', { method: 'PATCH', body: JSON.stringify(data) }),

  navigation: () => request<{ items: NavigationItem[] }>('/api/me/navigation'),

  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path: string) => request<void>(path, { method: 'DELETE' }),
};
