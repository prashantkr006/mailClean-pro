import type { AppSettings } from '@/types/domain';
import { DEFAULT_SETTINGS } from '@/types/domain';

export async function getSettings(): Promise<AppSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('settings', (result) => {
      const stored = result.settings;
      if (stored && typeof stored === 'object') {
        resolve({ ...DEFAULT_SETTINGS, ...stored });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    });
  });
}

export async function setSettings(settings: AppSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ settings }, resolve);
  });
}