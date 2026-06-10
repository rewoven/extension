import type { UserSettings, Message } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { getHiddenSites, removeHiddenSite } from '../shared/hidden-sites';

const enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;
const positionSelect = document.getElementById('position-select') as HTMLSelectElement;
const hiddenSitesSection = document.getElementById('hidden-sites-section') as HTMLElement;
const hiddenSitesList = document.getElementById('hidden-sites-list') as HTMLElement;

chrome.storage.sync.get('settings', (data) => {
  const settings: UserSettings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  enabledToggle.checked = settings.enabled;
  positionSelect.value = settings.overlayPosition;
});

async function renderHiddenSites() {
  const sites = await getHiddenSites();
  hiddenSitesSection.hidden = sites.length === 0;
  hiddenSitesList.textContent = '';
  for (const site of sites) {
    const row = document.createElement('div');
    row.className = 'hidden-site-row';

    const name = document.createElement('span');
    name.className = 'hidden-site-name';
    name.textContent = site;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'hidden-site-remove';
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', async () => {
      await removeHiddenSite(site);
      renderHiddenSites();
    });

    row.append(name, removeBtn);
    hiddenSitesList.appendChild(row);
  }
}

renderHiddenSites();

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
