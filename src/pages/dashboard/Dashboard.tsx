import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useScanStore } from '@/stores/scanStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { StatCard } from '@/components/StatCard';
import { CategoryPieChart } from '@/components/Charts/CategoryPieChart';
import { StorageBarChart } from '@/components/Charts/StorageBarChart';
import { ReviewPanel } from '@/components/ReviewPanel';
import { ScanProgress } from '@/components/ScanProgress';
import { Button } from '@/components/ui/Button';
import { formatBytes, formatNumber } from '@/utils/format';
import type { BGMessage } from '@/types/messages';

export function Dashboard() {
  const { signedIn, user } = useAuthStore();
  const { summary, isScanning, progress, scanError } = useScanStore();
  const { settings: _settings } = useSettingsStore();
  const scanPortRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    const listener = (message: BGMessage) => {
      switch (message.type) {
        case 'AUTH_STATUS':
          useAuthStore.getState().setAuth(message.signedIn, message.user ?? null);
          break;
        case 'SCAN_PROGRESS':
          useScanStore.getState().setProgress({
            scanned: message.scanned,
            total: message.total,
            phase: message.phase,
          });
          break;
        case 'SCAN_UPDATE':
          useScanStore.getState().setSummary(message.summary);
          useScanStore.getState().setEmails(message.emails);
          break;
        case 'SCAN_COMPLETE':
          useScanStore.getState().setSummary(message.summary);
          useScanStore.getState().setEmails(message.emails);
          useScanStore.getState().setScanning(false);
          useScanStore.getState().setProgress(null);
          useScanStore.getState().setScanError(null);
          scanPortRef.current?.disconnect();
          scanPortRef.current = null;
          break;
        case 'SCAN_ERROR':
          useScanStore.getState().setScanning(false);
          useScanStore.getState().setProgress(null);
          useScanStore.getState().setScanError(message.message);
          scanPortRef.current?.disconnect();
          scanPortRef.current = null;
          break;
        case 'TRASH_COMPLETE':
        case 'TRASH_PROGRESS':
        case 'TRASH_ERROR':
        case 'UNSUBSCRIBE_COMPLETE':
        case 'UNSUBSCRIBE_ERROR':
        case 'BULK_UNSUBSCRIBE_PROGRESS':
          break;
        case 'BULK_UNSUBSCRIBE_COMPLETE':
          useScanStore.getState().removeEmails(
            useScanStore.getState().emails
              .filter((e) => e.categories.includes('inactive_subscription'))
              .map((e) => e.id),
          );
          break;
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: 'GET_AUTH_STATUS' },
      (response: { ok: boolean; data?: { type: string; signedIn: boolean; user?: { email: string; name: string; pictureUrl?: string } } }) => {
        if (chrome.runtime.lastError) return;
        if (response?.ok && response.data?.type === 'AUTH_STATUS') {
          useAuthStore.getState().setAuth(response.data.signedIn, response.data.user ?? null);
        }
      },
    );
  }, []);

  const handleStartScan = () => {
    // Open a long-lived port to keep the service worker alive for the full scan duration.
    scanPortRef.current?.disconnect();
    scanPortRef.current = chrome.runtime.connect({ name: 'scan-keepalive' });
    useScanStore.getState().setScanning(true);
    useScanStore.getState().setScanError(null);
    chrome.runtime.sendMessage({ type: 'SCAN_START', options: {} });
  };

  const handleSignIn = () => {
    chrome.runtime.sendMessage({ type: 'AUTH_REQUEST' });
  };

  const handleSignOut = () => {
    chrome.runtime.sendMessage({ type: 'AUTH_SIGN_OUT' });
  };

  if (!signedIn) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="font-display text-3xl text-ink text-center mb-2">MailClean Pro</h1>
          <p className="text-ink-muted text-center mb-8">
            Sign in to start cleaning your Gmail inbox.
          </p>
          <Button onClick={handleSignIn} className="w-full">
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-white border-b border-paper-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="font-display text-2xl text-ink">MailClean Pro</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-ink-muted">{user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isScanning && progress && <ScanProgress {...progress} />}

        {scanError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            <strong>Scan failed:</strong> {scanError}
          </div>
        )}

        {!summary && !isScanning && !scanError && (
          <div className="text-center py-24">
            <h2 className="font-display text-4xl text-ink mb-4">Your inbox, decluttered.</h2>
            <p className="text-ink-muted mb-8 max-w-md mx-auto">
              Scan your Gmail to find promotional emails, old unread messages, and bulk senders
              taking up space.
            </p>
            <Button size="lg" onClick={handleStartScan}>
              Start Scan
            </Button>
          </div>
        )}

        {summary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Scanned" value={formatNumber(summary.totalScanned)} icon="📧" />
              <StatCard title="Flagged for Cleanup" value={formatNumber(summary.totalFlagged)} icon="🚩" />
              <StatCard title="Storage Reclaimable" value={formatBytes(summary.storageReclaimableBytes)} icon="💾" />
              <StatCard title="Scan Duration" value={`${Math.round(summary.scanDurationMs / 1000)}s`} icon="⏱" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <CategoryPieChart data={summary.categoryCounts} />
              <StorageBarChart data={summary.topSenders} />
            </div>
          </>
        )}

        {(summary || isScanning) && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-ink">Email Review</h2>
              <Button onClick={handleStartScan} disabled={isScanning}>
                {isScanning ? 'Scanning…' : 'Rescan'}
              </Button>
            </div>
            <ReviewPanel />
          </div>
        )}
      </main>
    </div>
  );
}
