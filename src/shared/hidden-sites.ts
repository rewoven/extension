export function getHiddenSites(): Promise<string[]> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get('hiddenSites', (data) => {
        const list = data?.hiddenSites;
        resolve(Array.isArray(list) ? list.filter((s): s is string => typeof s === 'string') : []);
      });
    } catch {
      resolve([]);
    }
  });
}

export function setHiddenSites(sites: string[]): Promise<void> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ hiddenSites: sites }, () => resolve());
    } catch {
      resolve();
    }
  });
}

export async function addHiddenSite(hostname: string): Promise<void> {
  const host = hostname.toLowerCase();
  const sites = await getHiddenSites();
  if (!sites.includes(host)) {
    await setHiddenSites([...sites, host]);
  }
}

export async function removeHiddenSite(hostname: string): Promise<void> {
  const host = hostname.toLowerCase();
  const sites = await getHiddenSites();
  await setHiddenSites(sites.filter((s) => s !== host));
}

export function isSiteHidden(hostname: string, hiddenSites: string[]): boolean {
  const host = hostname.toLowerCase();
  return hiddenSites.some((s) => host === s || host.endsWith('.' + s));
}
