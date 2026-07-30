import { webEnvironment } from './environment.js';

let currentAuthToken: string | null = null;

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined' && !currentAuthToken) {
    currentAuthToken = localStorage.getItem('learning_os_token');
  }
  return currentAuthToken;
}

export function setAuthToken(token: string): void {
  currentAuthToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('learning_os_token', token);
  }
}

export function removeAuthToken(): void {
  currentAuthToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('learning_os_token');
  }
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = webEnvironment.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = (await response.json()) as { message?: string | string[] };
      if (errorJson.message) {
        errorMessage = Array.isArray(errorJson.message)
          ? errorJson.message.join(', ')
          : errorJson.message;
      }
    } catch {
      // fallback to default status text if not JSON
    }
    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
