import { useEffect } from 'react';
import { useScanStore } from '@/stores/scanStore';
import type { BGMessage } from '@/types/messages';
import type { ScanOptions } from '@/types/domain';

export function useScan() {
  const { summary, emails, isScanning, scanError, progress, setSummary, setEmails, setScanning, setScanError, setProgress } =
    useScanStore();

  useEffect(() => {
    const listener = (message: BGMessage) => {
      switch (message.type) {
        case 'SCAN_PROGRESS':
          setProgress({ scanned: message.scanned, total: message.total, phase: message.phase });
          break;
        case 'SCAN_COMPLETE':
          setSummary(message.summary);
          setEmails(message.emails);
          setScanning(false);
          setProgress(null);
          break;
        case 'SCAN_ERROR':
          setScanning(false);
          setProgress(null);
          setScanError(message.message);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [setSummary, setEmails, setScanning, setProgress]);

  const startScan = (options: ScanOptions = {}) => {
    setScanning(true);
    setScanError(null);
    chrome.runtime.sendMessage({ type: 'SCAN_START', options });
  };

  return { summary, emails, isScanning, scanError, progress, startScan };
}
