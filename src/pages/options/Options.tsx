import React, { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/Button';
import type { AppSettings } from '@/types/domain';

export function Options() {
  const { settings, updateSettings } = useSettingsStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Settings are already persisted to chrome.storage.sync by the store adapter.
    // This just provides user confirmation.
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const setThreshold = (value: string): AppSettings['oldEmailThresholdDays'] => {
    const n = parseInt(value, 10);
    if (n === 30 || n === 60 || n === 90 || n === 180) return n;
    return 60;
  };

  const setBulkThreshold = (value: string): AppSettings['bulkSenderThreshold'] => {
    const n = parseInt(value, 10);
    if (n === 10 || n === 20 || n === 50 || n === 100) return n;
    return 20;
  };

  const setFrequency = (value: string): AppSettings['autoScanFrequency'] => {
    if (value === 'off' || value === 'daily' || value === 'weekly') return value;
    return 'off';
  };

  const setAggressiveness = (value: string): AppSettings['aggressiveness'] => {
    if (value === 'conservative' || value === 'balanced' || value === 'aggressive') return value;
    return 'balanced';
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="font-display text-3xl text-ink mb-8">Settings</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2">
              Old Email Threshold
            </label>
            <select
              value={settings.oldEmailThresholdDays}
              onChange={(e) => updateSettings({ oldEmailThresholdDays: setThreshold(e.target.value) })}
              className="w-full px-3 py-2 border border-paper-border rounded-md text-ink"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
            </select>
            <p className="text-xs text-ink-muted mt-1">
              Unread emails older than this threshold are flagged.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2">
              Bulk Sender Threshold
            </label>
            <select
              value={settings.bulkSenderThreshold}
              onChange={(e) => updateSettings({ bulkSenderThreshold: setBulkThreshold(e.target.value) })}
              className="w-full px-3 py-2 border border-paper-border rounded-md text-ink"
            >
              <option value={10}>10 emails</option>
              <option value={20}>20 emails</option>
              <option value={50}>50 emails</option>
              <option value={100}>100 emails</option>
            </select>
            <p className="text-xs text-ink-muted mt-1">
              Senders with more than this many emails are flagged as bulk.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2">
              Auto-Scan Frequency
            </label>
            <select
              value={settings.autoScanFrequency}
              onChange={(e) => updateSettings({ autoScanFrequency: setFrequency(e.target.value) })}
              className="w-full px-3 py-2 border border-paper-border rounded-md text-ink"
            >
              <option value="off">Off</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2">
              Cleanup Aggressiveness
            </label>
            <select
              value={settings.aggressiveness}
              onChange={(e) => updateSettings({ aggressiveness: setAggressiveness(e.target.value) })}
              className="w-full px-3 py-2 border border-paper-border rounded-md text-ink"
            >
              <option value="conservative">Conservative — only flag high-confidence junk</option>
              <option value="balanced">Balanced (recommended)</option>
              <option value="aggressive">Aggressive — cast a wide net</option>
            </select>
          </div>

          <div className="pt-2 flex items-center gap-4">
            <Button onClick={handleSave} className="flex-shrink-0">
              Save Settings
            </Button>
            {saved && (
              <span className="text-sm text-accent-keep">Settings saved.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
