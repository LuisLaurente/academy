import { describe, expect, it, vi } from 'vitest';
import { apiFetch, getAuthToken, removeAuthToken, setAuthToken } from './api-client';
import { loginUser, logoutUser, registerUser } from './auth-service';

describe('api-client and auth-service', () => {
  it('manages auth token in storage', () => {
    setAuthToken('test-token-123');
    expect(getAuthToken()).toBe('test-token-123');

    removeAuthToken();
    expect(getAuthToken()).toBeNull();
  });

  it('makes fetch call with auth headers', async () => {
    setAuthToken('token-abc');

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
      ok: true,
      status: 200,
    } as Response);

    const data = await apiFetch<{ success: boolean }>('/test-endpoint');
    expect(data.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
  });

  it('handles loginUser and registerUser', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        accessToken: 'mock-jwt',
        email: 'user@test.com',
        userId: 'user-1',
      }),
      ok: true,
      status: 200,
    } as Response);

    const reg = await registerUser({ email: 'user@test.com', password: 'password123' });
    expect(reg.accessToken).toBe('mock-jwt');
    expect(getAuthToken()).toBe('mock-jwt');

    const log = await loginUser({ email: 'user@test.com', password: 'password123' });
    expect(log.userId).toBe('user-1');

    logoutUser();
    expect(getAuthToken()).toBeNull();
  });
});
