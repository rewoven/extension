import type { Message, UserSettings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';

// Handle messages from the popup. (Product scoring now runs directly in the
// content script - no message round-trip / service-worker wake-up needed.)
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_SETTINGS': {
      chrome.storage.sync.get('settings', (data) => {
        const settings: UserSettings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
        sendResponse({ type: 'SETTINGS_RESULT', payload: settings } as Message);
      });
      return true; // keep channel open for async response
    }

    case 'UPDATE_SETTINGS': {
      chrome.storage.sync.get('settings', (data) => {
        const current: UserSettings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
        const updated = { ...current, ...message.payload };
        chrome.storage.sync.set({ settings: updated }, () => {
          sendResponse({ type: 'SETTINGS_RESULT', payload: updated } as Message);
        });
      });
      return true;
    }
  }
});

// Set default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('settings', (data) => {
    if (!data.settings) {
      chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    }
  });
  console.log('[Rewoven] Shopping Lens installed!');
});
