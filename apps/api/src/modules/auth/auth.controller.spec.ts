import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '@learning-os/server/core';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const controller = new AuthController(new CryptoUuidService());

  it('registers user and returns AuthResponseDto', async () => {
    const res = await controller.register({
      email: 'student@academy.edu',
      password: 'SecurePassword123',
    });

    expect(res.email).toBe('student@academy.edu');
    expect(res.userId).toBeTruthy();
    expect(res.accessToken).toContain('bearer-token-');
  });

  it('logins user and returns AuthResponseDto', async () => {
    const res = await controller.login({
      email: 'student@academy.edu',
      password: 'SecurePassword123',
    });

    expect(res.email).toBe('student@academy.edu');
    expect(res.accessToken).toBeTruthy();
  });
});
