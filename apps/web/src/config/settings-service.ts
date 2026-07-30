import { apiFetch } from './api-client';

export interface SystemSetting {
  readonly key: string;
  readonly value: string;
}

export async function getSettings(): Promise<readonly SystemSetting[]> {
  return apiFetch<SystemSetting[]>('/settings');
}

export async function saveSetting(key: string, value: string): Promise<SystemSetting> {
  return apiFetch<SystemSetting>('/settings', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
}
