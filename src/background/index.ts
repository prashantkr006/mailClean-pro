import { messageRouter } from './messageRouter';
import { initializeAlarms, setupAlarmListener } from './alarms';

chrome.runtime.onInstalled.addListener(() => {
  initializeAlarms().catch((error) => {
    console.error('Failed to initialize alarms:', error);
  });
});

// Setup alarm listener (runs immediately on SW load)
setupAlarmListener();

chrome.runtime.onMessage.addListener(messageRouter);