import type {
  Draft,
  DraftItem,
  PobPricingJobItem,
  PobPricingJob,
  PobPricingStartRequest,
  PurchaseHistoryItem,
  TradeCapture,
  VisitHistoryItem,
} from "../types";
import type { DebugLogEntry, DebugLogLevel } from "../utils/debugLog";
import { onMessage, sendMessage } from "../utils/messages";

const DEBUG_LOG_STORAGE_KEY = "poeSlDebugLogs:v1";
const MAX_DEBUG_LOGS = 500;
const STALE_JOB_MS = 5 * 60_000;
const runningPricingJobs = new Set<string>();

export default defineBackground(() => {
  writeDebugLog("background", "startup", "Service worker started");
  void cleanupOrphanPricingWorkerTabs().then(() => resumeIncompletePricingJobs());

  // ── Side panel activation ─────────────────────────────────────────────────

  // Handle icon clicks ourselves so we can redirect non-trade pages to PoE Trade.
  // @ts-expect-error — chrome.sidePanel is MV3-only
  chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: false });

  browser.action.onClicked.addListener(async (tab: { id?: number; url?: string }) => {
    const tabId = tab.id;

    if (tabId && isTradeUrl(tab.url)) {
      // @ts-expect-error — chrome.sidePanel is MV3-only
      await chrome.sidePanel?.open?.({ tabId });
      return;
    }

    if (tabId) {
      await browser.tabs.update(tabId, { url: TRADE_HOME_URL });
      return;
    }

    await browser.tabs.create({ url: TRADE_HOME_URL });
  });

  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== "poe-sl-sidepanel-visibility") {
      return;
    }

    let activeTabId: number | null = null;

    port.onMessage.addListener((message: { tabId?: number; open?: boolean }) => {
      if (typeof message.tabId !== "number") {
        return;
      }

      activeTabId = message.tabId;

      if (typeof message.open === "boolean") {
        sendMessage("csFabVisibilitySet", { visible: !message.open }, activeTabId).catch(() => {});
      }
    });

    port.onDisconnect.addListener(() => {
      if (typeof activeTabId !== "number") {
        return;
      }

      sendMessage("csFabVisibilitySet", { visible: true }, activeTabId).catch(() => {});
    });
  });

  // Sync side panel enabled state for all already-open tabs on service worker start
  browser.runtime.onInstalled.addListener(() => initSidePanelForCurrentTabs());
  browser.runtime.onStartup.addListener(() => initSidePanelForCurrentTabs());

  // Enable the side panel only on relevant pages (trade + build guide sites)
  browser.tabs.onActivated.addListener(async ({ tabId }) => {
    try {
      const tab = await browser.tabs.get(tabId);
      await setSidePanelEnabled(tabId, isSidePanelUrl(tab.url));
    } catch {}
  });

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
      try {
        await setSidePanelEnabled(tabId, isSidePanelUrl(tab.url));
      } catch {}
    }
  });

  // ── Content Script → Service Worker handlers ─────────────────────────────

  // CS reports capture availability → broadcast to sidepanel
  onMessage("csCaptureStatus", (message) => {
    const tabId = message.sender.tab?.id;
    const tabUrl = message.sender.tab?.url;
    if (!tabId || !tabUrl) return;

    sendMessage("captureStatusChanged", {
      tabId,
      tabUrl,
      available: message.data,
    }).catch(() => {}); // sidepanel may not be open — swallow error
  });

  // CS sends purchase history item → persist to storage
  onMessage("csPurchaseHistoryAdd", async (message) => {
    const item = message.data;
    const stored = await browser.storage.local.get("purchaseHistory");
    const current: PurchaseHistoryItem[] = Array.isArray(stored.purchaseHistory)
      ? stored.purchaseHistory
      : [];
    const idx = current.findIndex((i) => i.listingId === item.listingId);
    if (idx >= 0) {
      current[idx] = item;
    } else {
      current.unshift(item);
    }
    await browser.storage.local.set({ purchaseHistory: current });
  });

  onMessage("csVisitHistoryAdd", async (message) => {
    const item = message.data;
    const stored = await browser.storage.local.get("visitHistory");
    const current: VisitHistoryItem[] = Array.isArray(stored.visitHistory)
      ? stored.visitHistory
      : [];
    current.unshift(item);
    await browser.storage.local.set({ visitHistory: current });
  });

  // CS requests save-search flow → open sidepanel + trigger save
  onMessage("csSaveSearch", async (message) => {
    const tabId = message.sender.tab?.id;
    if (tabId) {
      // @ts-expect-error — chrome.sidePanel is MV3-only
      await chrome.sidePanel?.open?.({ tabId });
    }
    await browser.storage.local.set({ triggerSaveSearch: Date.now() });
  });

  // CS requests sidepanel open
  onMessage("csOpenSidepanel", async (message) => {
    const tabId = message.sender.tab?.id;
    if (tabId) {
      // @ts-expect-error — chrome.sidePanel is MV3-only
      await chrome.sidePanel?.open?.({ tabId });
    }
  });

  onMessage("csPobPricingStart", async (message) => {
    const tabId = message.sender.tab?.id;
    await writeDebugLog("background", "csPobPricingStart:received", "PoB pricing start requested", {
      tabId,
      itemCount: message.data.items.length,
      buildUrl: message.data.buildUrl,
      buildName: message.data.buildName,
      league: message.data.league,
      firstItems: message.data.items.slice(0, 5).map((item) => ({
        id: item.id,
        name: item.name,
        kind: item.kind,
        queryHash: item.queryHash,
        tradeUrl: item.tradeUrl,
      })),
    });
    const response = await startPobPricingJob(message.data);
    void runPobPricingJob(response.jobId);
    return response;
  });

  onMessage("csDebugLog", async (message) => {
    await persistDebugLog({
      ...message.data,
      data: {
        ...(typeof message.data.data === "object" && message.data.data !== null
          ? (message.data.data as Record<string, unknown>)
          : { value: message.data.data }),
        senderTabId: message.sender.tab?.id,
        senderUrl: message.sender.tab?.url,
      },
    });
  });

  // ── Side Panel → Service Worker handlers (relay to Content Script) ──────

  // SP requests capture data → relay to active tab's CS
  onMessage("spCaptureRead", async () => {
    const tabId = await getActiveTabId();
    if (!tabId) return null;
    return await sendMessage("csCaptureRead", undefined, tabId);
  });

  // SP requests auto-capture data → relay to active tab's CS
  onMessage("spAutoCaptureRead", async () => {
    const tabId = await getActiveTabId();
    if (!tabId) return null;
    return await sendMessage("csAutoCaptureRead", undefined, tabId);
  });

  // SP requests search bar text → relay to active tab's CS
  onMessage("spSearchBarGet", async () => {
    const tabId = await getActiveTabId();
    if (!tabId) return { text: "" };
    return await sendMessage("csSearchBarGet", undefined, tabId);
  });

  onMessage("spSearchFiltersRead", async () => {
    const tabId = await getActiveTabId();
    if (!tabId) return null;
    return await sendMessage("csSearchFiltersRead", undefined, tabId);
  });

  // SP reports open/close state → relay FAB visibility to active tab's CS
  onMessage("spSidepanelVisibilitySet", async (message) => {
    const tabId = await getActiveTabId();
    if (!tabId) return;
    await sendMessage("csFabVisibilitySet", { visible: !message.data.open }, tabId).catch(() => {});
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const TRADE_HOME_URL = "https://www.pathofexile.com/trade";

function isTradeUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes("pathofexile.com/trade");
}

function isSidePanelUrl(url?: string): boolean {
  if (!url) return false;
  return isTradeUrl(url) || url.includes("pobb.in/") || url.includes("maxroll.gg/");
}

async function initSidePanelForCurrentTabs(): Promise<void> {
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) await setSidePanelEnabled(tab.id, isSidePanelUrl(tab.url));
  }
}

async function setSidePanelEnabled(tabId: number, enabled: boolean): Promise<void> {
  try {
    // @ts-expect-error — chrome.sidePanel is MV3-only
    await chrome.sidePanel?.setOptions?.({
      tabId,
      enabled,
      path: "sidepanel.html",
    });
  } catch {}
}

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab?.id;
}

async function startPobPricingJob(request: PobPricingStartRequest) {
  const draftId = crypto.randomUUID();
  const now = Date.now();
  await writeDebugLog("background", "job:create:start", "Creating PoB pricing draft and job", {
    draftId,
    buildUrl: request.buildUrl,
    buildName: request.buildName,
    league: request.league,
    itemCount: request.items.length,
  });
  const draftItems: DraftItem[] = request.items.map((item, index) => ({
    id: crypto.randomUUID(),
    position: index,
    name: item.name,
    tradeUrl: item.tradeUrl,
    capture: null,
    completed: false,
    kind: item.kind,
    ...(item.base ? { base: item.base } : {}),
    queryHash: item.queryHash,
    pricingStatus: "pending",
    source: item.source,
    addedAt: now,
  }));

  const draft: Draft = {
    id: draftId,
    name: request.buildName || "Priced PoB build",
    game: "poe1",
    league: request.league,
    createdAt: now,
    items: draftItems,
    buildUrl: request.buildUrl,
  };

  const drafts = await getStorageArray<Draft>("drafts");
  await browser.storage.local.set({ drafts: [...drafts, draft] });

  const jobId = crypto.randomUUID();
  const job: PobPricingJob = {
    id: jobId,
    draftId,
    sourceUrl: request.buildUrl,
    league: request.league,
    status: "queued",
    total: draftItems.length,
    completed: 0,
    createdAt: now,
    updatedAt: now,
    items: draftItems.map((draftItem, index) => ({
      draftItemId: draftItem.id,
      tradeUrl: request.items[index]!.tradeUrl,
      queryHash: request.items[index]!.queryHash,
      status: "pending",
    })),
  };
  const jobs = await getStorageArray<PobPricingJob>("pricingJobs:v1");
  await browser.storage.local.set({ "pricingJobs:v1": [...jobs, job] });
  await writeDebugLog("background", "job:create:complete", "Created PoB pricing job", {
    draftId,
    jobId,
    total: job.total,
  });
  return { draftId, jobId };
}

async function runPobPricingJob(jobId: string) {
  if (runningPricingJobs.has(jobId)) {
    await writeDebugLog(
      "background",
      "job:run:skip-duplicate",
      "Pricing job is already running",
      {
        jobId,
      },
      "warn",
    );
    return;
  }
  runningPricingJobs.add(jobId);
  let workerTabId: number | undefined;
  try {
    await writeDebugLog("background", "job:run:start", "Starting PoB pricing job", { jobId });
    await patchJob(jobId, { status: "running" });
    const job = await getJob(jobId);
    if (!job) return;
    const tab = await browser.tabs.create({ url: TRADE_HOME_URL, active: false });
    workerTabId = tab.id;
    if (!workerTabId) throw new Error("Could not create background trade tab.");
    await patchJob(jobId, { workerTabId });
    await writeDebugLog(
      "background",
      "job:worker-tab:created",
      "Created reusable inactive trade tab",
      {
        jobId,
        workerTabId,
        total: job.total,
      },
    );

    for (const item of job.items.filter((entry) => entry.status === "pending")) {
      await priceJobItem(job, item, workerTabId);
    }
    await patchJob(jobId, { status: "completed", currentItemId: undefined });
    await writeDebugLog("background", "job:run:complete", "Completed PoB pricing job", { jobId });
  } catch (error) {
    const job = await getJob(jobId);
    await writeDebugLog(
      "background",
      "job:run:failed",
      "PoB pricing job failed",
      {
        jobId,
        error: errorToMessage(error),
      },
      "error",
    );
    if (job) {
      for (const item of job.items.filter((entry) => entry.status === "pending")) {
        await updateDraftItem(job.draftId, item.draftItemId, {
          pricingStatus: "failed",
          pricingError: errorToMessage(error),
        });
        await updateJobItem(jobId, item.draftItemId, "failed", errorToMessage(error));
      }
    }
    await patchJob(jobId, {
      status: "failed",
      error: errorToMessage(error),
    });
  } finally {
    runningPricingJobs.delete(jobId);
    if (workerTabId) {
      await writeDebugLog("background", "job:worker-tab:closing", "Closing reusable trade tab", {
        jobId,
        workerTabId,
      });
      await browser.tabs.remove(workerTabId).catch((error) =>
        writeDebugLog(
          "background",
          "job:worker-tab:close-failed",
          "Could not close worker tab",
          {
            jobId,
            workerTabId,
            error: errorToMessage(error),
          },
          "warn",
        ),
      );
      await patchJob(jobId, { workerTabId: undefined });
    }
  }
}

async function priceJobItem(job: PobPricingJob, item: PobPricingJobItem, workerTabId: number) {
  const jobId = job.id;
  const workerUrl = withPricingWorkerMarker(item.tradeUrl);
  try {
    await patchJob(jobId, { currentItemId: item.draftItemId });
    await writeDebugLog(
      "background",
      "job:item:navigate",
      "Navigating worker tab to item trade URL",
      {
        jobId,
        draftId: job.draftId,
        draftItemId: item.draftItemId,
        queryHash: item.queryHash,
        workerTabId,
        tradeUrl: item.tradeUrl,
        workerUrl,
      },
    );
    const tabLoad = waitForTabComplete(workerTabId, 30_000);
    await browser.tabs.update(workerTabId, {
      url: workerUrl,
      active: false,
    });
    await tabLoad;
    await delay(1_000);
    await writeDebugLog(
      "background",
      "job:item:capture-request",
      "Requesting capture from worker tab",
      {
        jobId,
        draftItemId: item.draftItemId,
        workerTabId,
      },
    );
    let result = await sendMessageWithRetries(
      workerTabId,
      item.tradeUrl,
      { expectedUrl: item.tradeUrl, timeoutMs: 8_000 },
      3,
    );
    if (result.reason === "timeout") {
      await writeDebugLog(
        "background",
        "job:item:capture-timeout-retry",
        "Retrying capture after timeout response",
        { jobId, draftItemId: item.draftItemId, workerTabId },
        "warn",
      );
      result = await sendMessageWithRetries(
        workerTabId,
        item.tradeUrl,
        { expectedUrl: item.tradeUrl, timeoutMs: 10_000 },
        2,
      );
    }
    if (result.reason === "blocked") {
      throw new Error("Trade site rate limit or block detected.");
    }
    const capture = result.capture;
    const status = capture && capture.aggregates.sampleSize > 0 ? "priced" : "unpriced";
    await writeDebugLog(
      "background",
      "job:item:capture-result",
      "Captured item pricing result",
      {
        jobId,
        draftItemId: item.draftItemId,
        queryHash: item.queryHash,
        status,
        reason: result.reason,
        sampleSize: capture?.aggregates.sampleSize ?? 0,
        median: capture?.aggregates.median,
      },
      status === "priced" ? "info" : "warn",
    );
    await updateDraftItem(job.draftId, item.draftItemId, {
      capture: status === "priced" ? capture : null,
      pricingStatus: status,
      ...(status === "unpriced"
        ? {
            pricingError: result.reason
              ? `No priced listings captured (${result.reason})`
              : "No priced listings captured",
          }
        : { pricingError: undefined }),
    });
    await updateJobItem(jobId, item.draftItemId, status);
  } catch (error) {
    const message = errorToMessage(error);
    await writeDebugLog(
      "background",
      "job:item:failed",
      "Failed to price item",
      {
        jobId,
        draftItemId: item.draftItemId,
        queryHash: item.queryHash,
        workerTabId,
        error: message,
      },
      "error",
    );
    if (/rate limit|block/i.test(message)) throw error;
    await updateDraftItem(job.draftId, item.draftItemId, {
      capture: null,
      pricingStatus: "failed",
      pricingError: message,
    });
    await updateJobItem(jobId, item.draftItemId, "failed", message);
  }
}

async function sendMessageWithRetries(
  workerTabId: number,
  expectedUrl: string,
  data: { expectedUrl: string; timeoutMs: number },
  attempts: number,
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await sendMessage("csTradeCaptureWhenReady", data, workerTabId);
    } catch (error) {
      lastError = error;
      await writeDebugLog(
        "background",
        "job:item:capture-retry",
        "Worker capture message failed",
        {
          workerTabId,
          expectedUrl,
          attempt,
          attempts,
          error: errorToMessage(error),
        },
        "warn",
      );
      await delay(750 * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(errorToMessage(lastError));
}

function withPricingWorkerMarker(tradeUrl: string): string {
  const url = new URL(tradeUrl);
  url.hash = "poe-sl-pricing";
  return url.toString();
}

async function resumeIncompletePricingJobs() {
  const jobs = await getStorageArray<PobPricingJob>("pricingJobs:v1");
  const now = Date.now();
  for (const job of jobs.filter(
    (entry) => entry.status === "queued" || entry.status === "running",
  )) {
    if (now - job.updatedAt > STALE_JOB_MS) {
      await writeDebugLog(
        "background",
        "job:resume:stale",
        "Marking stale pricing job as failed",
        {
          jobId: job.id,
          status: job.status,
          updatedAt: job.updatedAt,
        },
        "warn",
      );
      await failPendingJobItems(
        job,
        "Stale pricing job was not resumed after service worker restart.",
      );
      continue;
    }
    await writeDebugLog("background", "job:resume", "Resuming incomplete pricing job", {
      jobId: job.id,
      status: job.status,
      completed: job.completed,
      total: job.total,
    });
    void runPobPricingJob(job.id);
  }
}

async function cleanupOrphanPricingWorkerTabs(): Promise<void> {
  const jobs = await getStorageArray<PobPricingJob>("pricingJobs:v1");
  const activeWorkerTabIds = new Set(
    jobs
      .filter((job) => job.status === "queued" || job.status === "running")
      .map((job) => job.workerTabId)
      .filter((id): id is number => typeof id === "number"),
  );
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id || !tab.url?.includes("poe-sl-pricing")) continue;
    if (activeWorkerTabIds.has(tab.id)) continue;
    await writeDebugLog(
      "background",
      "worker-tab:cleanup",
      "Closing orphan pricing worker tab",
      {
        tabId: tab.id,
        url: tab.url,
      },
      "warn",
    );
    await browser.tabs.remove(tab.id).catch((error) =>
      writeDebugLog(
        "background",
        "worker-tab:cleanup-failed",
        "Could not close orphan pricing tab",
        {
          tabId: tab.id,
          error: errorToMessage(error),
        },
        "warn",
      ),
    );
  }
}

async function failPendingJobItems(job: PobPricingJob, error: string): Promise<void> {
  await patchJob(job.id, {
    status: "failed",
    currentItemId: undefined,
    workerTabId: undefined,
    error,
  });
  for (const item of job.items.filter((entry) => entry.status === "pending")) {
    await updateDraftItem(job.draftId, item.draftItemId, {
      pricingStatus: "failed",
      pricingError: error,
    });
    await updateJobItem(job.id, item.draftItemId, "failed", error);
  }
}

async function getStorageArray<T>(key: string): Promise<T[]> {
  const stored = await browser.storage.local.get(key);
  return Array.isArray(stored[key]) ? (stored[key] as T[]) : [];
}

async function getJob(jobId: string): Promise<PobPricingJob | null> {
  const jobs = await getStorageArray<PobPricingJob>("pricingJobs:v1");
  return jobs.find((job) => job.id === jobId) ?? null;
}

async function patchJob(jobId: string, patch: Partial<PobPricingJob>) {
  const jobs = await getStorageArray<PobPricingJob>("pricingJobs:v1");
  const next = jobs.map((job) =>
    job.id === jobId ? { ...job, ...patch, updatedAt: Date.now() } : job,
  );
  await browser.storage.local.set({ "pricingJobs:v1": next });
}

async function updateJobItem(
  jobId: string,
  draftItemId: string,
  status: "priced" | "unpriced" | "failed",
  error?: string,
) {
  const jobs = await getStorageArray<PobPricingJob>("pricingJobs:v1");
  const next = jobs.map((job) => {
    if (job.id !== jobId) return job;
    const items = job.items.map((item) =>
      item.draftItemId === draftItemId ? cleanUndefined({ ...item, status, error }) : item,
    );
    return {
      ...job,
      items,
      completed: items.filter((item) => item.status !== "pending").length,
      updatedAt: Date.now(),
    };
  });
  await browser.storage.local.set({ "pricingJobs:v1": next });
}

async function updateDraftItem(
  draftId: string,
  itemId: string,
  patch: Partial<DraftItem> & { capture?: TradeCapture | null },
) {
  const drafts = await getStorageArray<Draft>("drafts");
  const next = drafts.map((draft) => {
    if (draft.id !== draftId) return draft;
    return {
      ...draft,
      items: draft.items.map((item) =>
        item.id === itemId ? cleanUndefined({ ...item, ...patch }) : item,
      ),
    };
  });
  await browser.storage.local.set({ drafts: next });
}

function cleanUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function waitForTabComplete(tabId: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => done(new Error(`Timed out waiting for tab ${tabId} to load.`)),
      timeoutMs,
    );
    const listener = (id: number, info: { status?: string }) => {
      if (id === tabId && info.status === "complete") done();
    };
    function done(error?: Error) {
      clearTimeout(timer);
      browser.tabs.onUpdated.removeListener(listener);
      if (error) {
        reject(error);
        return;
      }
      resolve();
    }
    browser.tabs.onUpdated.addListener(listener);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeDebugLog(
  source: string,
  step: string,
  message: string,
  data?: unknown,
  level: DebugLogLevel = "debug",
): Promise<void> {
  await persistDebugLog({
    timestamp: Date.now(),
    level,
    source,
    step,
    message,
    data: sanitizeForLog(data),
  });
}

async function persistDebugLog(entry: DebugLogEntry): Promise<void> {
  const safeEntry = {
    ...entry,
    data: sanitizeForLog(entry.data),
  };
  const logMethod =
    safeEntry.level === "error"
      ? console.error
      : safeEntry.level === "warn"
        ? console.warn
        : console.debug;
  logMethod("[poe-sl]", safeEntry);

  try {
    const stored = await browser.storage.local.get(DEBUG_LOG_STORAGE_KEY);
    const current = Array.isArray(stored[DEBUG_LOG_STORAGE_KEY])
      ? (stored[DEBUG_LOG_STORAGE_KEY] as DebugLogEntry[])
      : [];
    await browser.storage.local.set({
      [DEBUG_LOG_STORAGE_KEY]: [...current, safeEntry].slice(-MAX_DEBUG_LOGS),
    });
  } catch (error) {
    console.warn("[poe-sl] Failed to persist debug log", error);
  }
}

function sanitizeForLog(value: unknown): unknown {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, entry) => {
        if (typeof entry === "string" && entry.length > 600) {
          return `${entry.slice(0, 600)}… (${entry.length} chars)`;
        }
        return entry;
      }),
    );
  } catch {
    return String(value);
  }
}

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
