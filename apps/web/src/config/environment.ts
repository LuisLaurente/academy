import { validateWebEnvironment } from '@learning-os/configuration';

export const webEnvironment = validateWebEnvironment({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (typeof window === 'undefined') {
  console.log('====================================');
  console.log('NEXT_PUBLIC_API_URL is resolved to:', webEnvironment.NEXT_PUBLIC_API_URL);
  console.log('====================================');
}
