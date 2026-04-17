import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useScanStore } from '@/stores/scanStore';
import { formatBytes, formatNumber } from '@/utils/format';

export function Popup() {
  const { signedIn, user, signIn } = useAuth();
  const { summary } = useScanStore();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = () => {
    setSigningIn(true);
    signIn();
    // OAuth opens a new window; popup may close. State resolves when popup reopens.
  };

  const handleOpenDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/pages/dashboard/index.html') });
  };

  if (!signedIn) {
    return (
      <div className="w-80 p-6 bg-paper">
        <h1 className="font-display text-2xl text-ink mb-1">MailClean Pro</h1>
        <p className="text-sm text-ink-muted mb-6">
          Sign in to clean up your Gmail inbox.
        </p>
        <Button
          onClick={handleSignIn}
          disabled={signingIn}
          className="w-full"
        >
          {signingIn ? 'Opening sign-in…' : 'Sign in with Google'}
        </Button>
        {signingIn && (
          <p className="text-xs text-ink-muted text-center mt-3">
            Complete sign-in in the Google window, then reopen this popup.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 p-4 bg-paper">
      <div className="flex items-center gap-3 mb-4">
        {user?.pictureUrl ? (
          <img
            src={user.pictureUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-paper-warm flex items-center justify-center text-ink-muted text-sm font-medium">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-ink truncate">MailClean Pro</h1>
          <p className="text-xs text-ink-muted truncate">{user?.email}</p>
        </div>
      </div>

      {summary && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-paper-border">
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
            Last Scan
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Scanned</span>
              <span className="font-medium text-ink">{formatNumber(summary.totalScanned)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Flagged</span>
              <span className="font-medium text-accent-promo">{formatNumber(summary.totalFlagged)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Reclaimable</span>
              <span className="font-medium text-ink">{formatBytes(summary.storageReclaimableBytes)}</span>
            </div>
          </div>
        </div>
      )}

      <Button onClick={handleOpenDashboard} className="w-full">
        Open Dashboard
      </Button>
    </div>
  );
}
