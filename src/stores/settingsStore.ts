import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppSettings } from '@/types/domain';
import { DEFAULT_SETTINGS } from '@/types/domain';

/** Custom storage adapter that syncs to chrome.storage.sync */
const chromeSyncStorage = createJSONStorage<SettingsStore>(() => ({
  getItem: (key) =>
    new Promise((resolve) => {
      chrome.storage.sync.get(key, (result) => {
        resolve((result[key] as string) ?? null);
      });
    }),
  setItem: (key, value) =>
    new Promise<void>((resolve) => {
      chrome.storage.sync.set({ [key]: value }, resolve);
    }),
  removeItem: (key) =>
    new Promise<void>((resolve) => {
      chrome.storage.sync.remove(key, resolve);
    }),
}));

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
    }),
    {
      name: 'mailclean-settings',
      storage: chromeSyncStorage,
    },
  ),
);
