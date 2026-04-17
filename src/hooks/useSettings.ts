import { useSettingsStore } from '@/stores/settingsStore';

export function useSettings() {
  const { settings, updateSettings } = useSettingsStore();

  return { settings, updateSettings };
}