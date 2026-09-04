export async function openUrl(url: string, inNewTab: boolean): Promise<void> {
  if (inNewTab) {
    await browser.tabs.create({ url });
    return;
  }
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id !== undefined) await browser.tabs.update(tab.id, { url });
}

export async function openTradeUrl(url: string, openInNewTab: boolean): Promise<void> {
  return openUrl(url, openInNewTab);
}
