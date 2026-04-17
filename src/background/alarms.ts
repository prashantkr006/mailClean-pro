import type { AppSettings } from '@/types/domain';
import { performScan } from './scan';

const SCAN_ALARM_NAME = 'mailclean-auto-scan';

export async function initializeAlarms(): Promise<void> {
  const settings = await getStoredSettings();

  if (settings.autoScanFrequency !== 'off') {
    const periodInMinutes =
      settings.autoScanFrequency === 'daily' ? 1440 : 10080;

    await chrome.alarms.create(SCAN_ALARM_NAME, {
      periodInMinutes,
    });
  }
}

export function setupAlarmListener(): void {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === SCAN_ALARM_NAME) {
      performScan({}).catch((error) => {
        console.error('Auto-scan failed:', error);
      });
    }
  });
}

export async function updateAutoScanFrequency(
  frequency: AppSettings['autoScanFrequency'],
): Promise<void> {
  await chrome.alarms.clear(SCAN_ALARM_NAME);

  if (frequency !== 'off') {
    const periodInMinutes = frequency === 'daily' ? 1440 : 10080;
    await chrome.alarms.create(SCAN_ALARM_NAME, { periodInMinutes });
  }
}

async function getStoredSettings(): Promise<AppSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('settings', (result) => {
      if (result.settings && typeof result.settings === 'object') {
        resolve(result.settings as AppSettings);
      } else {
        resolve({
          oldEmailThresholdDays: 60,
          bulkSenderThreshold: 20,
          autoScanFrequency: 'off',
          aggressiveness: 'balanced',
        });
      }
    });
  });
}