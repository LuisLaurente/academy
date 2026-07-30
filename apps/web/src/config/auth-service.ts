import { apiFetch, removeAuthToken, setAuthToken } from './api-client.js';

export interface AuthResponse {
  readonly accessToken: string;
  readonly email: string;
  readonly userId: string;
}

export interface AuthUser {
  readonly email: string;
  readonly id: string;
}

export async function registerUser(credentials: {
  readonly email: string;
  readonly password: string;
}): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>('/auth/register', {
    body: JSON.stringify(credentials),
    method: 'POST',
  });
  setAuthToken(response.accessToken);
  return response;
}

export async function loginUser(credentials: {
  readonly email: string;
  readonly password: string;
}): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>('/auth/login', {
    body: JSON.stringify(credentials),
    method: 'POST',
  });
  setAuthToken(response.accessToken);
  return response;
}

export function logoutUser(): void {
  removeAuthToken();
}
