import { messageRouter } from './messageRouter';
import { initializeAlarms, setupAlarmListener } from './alarms';

chrome.runtime.onInstalled.addListener(() => {
  initializeAlarms().catch((error) => {
    console.error('Failed to initialize alarms:', error);
  });
});

setupAlarmListener();

chrome.runtime.onMessage.addListener(messageRouter);

// Long-lived port keeps the service worker alive during scans.
// The dashboard opens a 'scan-keepalive' port before starting a scan
// and disconnects it once SCAN_COMPLETE or SCAN_ERROR is received.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'scan-keepalive') {
    port.onDisconnect.addListener(() => { /* scan session ended */ });
  }
});