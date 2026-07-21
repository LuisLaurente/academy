import { describe, expect, it } from 'vitest';

import { webEnvironment } from './environment';

describe('web environment', () => {
  it('exposes a validated API URL', () => {
    expect(() => new URL(webEnvironment.NEXT_PUBLIC_API_URL)).not.toThrow();
  });
});
