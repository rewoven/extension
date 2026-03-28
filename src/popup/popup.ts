import type { UserSettings, Message } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { initChat } from './chat';

const enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;
const positionSelect = document.getElementById('position-select') as HTMLSelectElement;

// Load settings
chrome.storage.sync.get('settings', (data) => {
  const settings: UserSettings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  enabledToggle.checked = settings.enabled;
  positionSelect.value = settings.overlayPosition;
});

// Save settings on change
enabledToggle.addEventListener('change', () => {
  updateSetting({ enabled: enabledToggle.checked });
});

positionSelect.addEventListener('change', () => {
  updateSetting({ overlayPosition: positionSelect.value as 'left' | 'right' });
});

function updateSetting(partial: Partial<UserSettings>) {
  chrome.runtime.sendMessage({
    type: 'UPDATE_SETTINGS',
    payload: partial,
  } as Message);
}

// Tab switching
const tabs = document.querySelectorAll<HTMLButtonElement>('.tab');
const tabContents = document.querySelectorAll<HTMLDivElement>('.tab-content');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach((t) => t.classList.remove('active'));
    tabContents.forEach((c) => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${target}`)?.classList.add('active');
  });
});

// Init chat
initChat();
