import type { ItemKind, TradeCapture } from "@/types";

export type PobPricingStatus = "pending" | "priced" | "unpriced" | "failed" | "skipped";

export interface PobPricingFilter {
  id: string;
  label: string;
  category: string;
  value?: { min?: number; max?: number; option?: string };
  enabled: boolean;
}

export interface PobPricingSource {
  type: "pob";
  buildUrl: string;
  itemSetId?: string;
  itemSetName?: string;
  skillGroupId?: string;
  skillGroupName?: string;
  slot?: string;
  pobItemId?: string;
}

export interface PobPricingPlanItem {
  id: string;
  name: string;
  kind: ItemKind;
  base?: string;
  tradeUrl: string;
  tradeQuery?: unknown;
  queryHash: string;
  filters: PobPricingFilter[];
  source: PobPricingSource;
}

export interface PobPricingStartRequest {
  buildUrl: string;
  buildName: string;
  league: string;
  items: PobPricingPlanItem[];
}

export interface PobPricingStartResponse {
  draftId: string;
  jobId: string;
}

export interface PobPricingJobItem {
  draftItemId: string;
  tradeUrl: string;
  queryHash: string;
  status: PobPricingStatus;
  error?: string;
}

export interface PobPricingJob {
  id: string;
  draftId: string;
  sourceUrl: string;
  league: string;
  status: "queued" | "running" | "completed" | "cancelled" | "failed";
  total: number;
  completed: number;
  currentItemId?: string;
  workerTabId?: number;
  createdAt: number;
  updatedAt: number;
  error?: string;
  items: PobPricingJobItem[];
}

export interface TradeCaptureWhenReadyRequest {
  expectedUrl: string;
  timeoutMs: number;
}

export interface TradeCaptureWhenReadyResponse {
  capture: TradeCapture | null;
  reason?: "timeout" | "empty" | "wrong-url" | "blocked";
}
