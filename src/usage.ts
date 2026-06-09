import { EditableProviderConfig, ProviderPreset, UsageMetric, UsageSnapshot } from "./types";

export interface UsageFetchResponse {
  ok: boolean;
  status: number;
  statusText?: string;
  text(): Promise<string>;
}

export type UsageFetch = (url: string, init: RequestInit) => Promise<UsageFetchResponse>;

export interface FetchProviderUsageOptions {
  fetchImpl?: UsageFetch;
  signal?: AbortSignal;
}

const DEEPSEEK_BALANCE_URL = "https://api.deepseek.com/user/balance";
const ZHIPU_USAGE_HOSTS = new Set(["open.bigmodel.cn", "dev.bigmodel.cn", "api.z.ai"]);

const defaultFetch: UsageFetch = async (url, init) => fetch(url, init);

export async function fetchProviderUsage(
  config: EditableProviderConfig,
  preset: ProviderPreset | undefined,
  token: string | undefined,
  now = new Date(),
  options: FetchProviderUsageOptions = {}
): Promise<UsageSnapshot> {
  const capability = preset?.usage ?? config.usage ?? { kind: "unsupported" as const };
  if (capability.kind === "unsupported") {
    return unsupportedSnapshot(config.providerId, capability.reason);
  }
  if (capability.kind === "externalLink") {
    if (!isHttpUrl(capability.url)) {
      return unsupportedSnapshot(config.providerId);
    }
    return {
      providerId: config.providerId,
      status: "externalLink",
      metrics: [],
      externalUrl: capability.url
    };
  }
  if (!token?.trim()) {
    return {
      providerId: config.providerId,
      status: "missingToken",
      metrics: [],
      experimental: capability.experimental,
      externalUrl: capability.consoleUrl
    };
  }

  try {
    switch (capability.adapter) {
      case "deepseekBalance":
        return await fetchDeepSeekBalance(config.providerId, token, now, options, capability.consoleUrl);
      case "zhipuCodingPlan":
        return await fetchZhipuCodingPlanUsage(config, token, now, options, Boolean(capability.experimental), capability.consoleUrl);
    }
  } catch (error) {
    return {
      providerId: config.providerId,
      status: "error",
      fetchedAt: now.toISOString(),
      metrics: [],
      message: formatUsageError(error),
      experimental: capability.experimental,
      externalUrl: capability.consoleUrl
    };
  }
}

async function fetchDeepSeekBalance(
  providerId: string,
  token: string,
  now: Date,
  options: FetchProviderUsageOptions,
  consoleUrl?: string
): Promise<UsageSnapshot> {
  const data = await requestJson(options.fetchImpl ?? defaultFetch, DEEPSEEK_BALANCE_URL, {
    method: "GET",
    signal: options.signal,
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      "Content-Type": "application/json"
    }
  }, "DeepSeek balance");

  const metrics: UsageMetric[] = [];
  if (isRecord(data)) {
    metrics.push({
      label: "API available",
      value: data.is_available === true ? "Yes" : "No"
    });

    const balanceInfos = Array.isArray(data.balance_infos) ? data.balance_infos.filter(isRecord) : [];
    for (const item of balanceInfos) {
      const currency = stringValue(item.currency) || "Balance";
      addMetric(metrics, `${currency} total`, item.total_balance);
      addMetric(metrics, `${currency} granted`, item.granted_balance);
      addMetric(metrics, `${currency} topped up`, item.topped_up_balance);
    }
  }

  return {
    providerId,
    status: "available",
    fetchedAt: now.toISOString(),
    metrics,
    message: metrics.length > 1 ? "DeepSeek balance fetched." : "No balance entries returned.",
    externalUrl: consoleUrl
  };
}

async function fetchZhipuCodingPlanUsage(
  config: EditableProviderConfig,
  token: string,
  now: Date,
  options: FetchProviderUsageOptions,
  experimental: boolean,
  consoleUrl?: string
): Promise<UsageSnapshot> {
  const origin = zhipuUsageOrigin(config.baseUrl);
  const window = zhipuUsageWindow(now);
  const queryParams = `?startTime=${encodeURIComponent(window.startTime)}&endTime=${encodeURIComponent(window.endTime)}`;
  const fetchImpl = options.fetchImpl ?? defaultFetch;
  const init: RequestInit = {
    method: "GET",
    signal: options.signal,
    headers: {
      Authorization: token.trim(),
      "Accept-Language": "en-US,en",
      "Content-Type": "application/json"
    }
  };

  await requestJson(fetchImpl, `${origin}/api/monitor/usage/model-usage${queryParams}`, init, "Zhipu model usage");
  await requestJson(fetchImpl, `${origin}/api/monitor/usage/tool-usage${queryParams}`, init, "Zhipu tool usage");
  const quotaLimit = extractData(
    await requestJson(fetchImpl, `${origin}/api/monitor/usage/quota/limit`, init, "Zhipu quota limit")
  );

  const metrics = zhipuQuotaMetrics(quotaLimit);
  return {
    providerId: config.providerId,
    status: "available",
    fetchedAt: now.toISOString(),
    metrics,
    message: metrics.length > 0 ? "Zhipu usage fetched." : "No quota limits returned.",
    experimental,
    externalUrl: consoleUrl
  };
}

function unsupportedSnapshot(providerId: string, reason?: string): UsageSnapshot {
  return {
    providerId,
    status: "unsupported",
    metrics: [],
    message: reason
  };
}

async function requestJson(fetchImpl: UsageFetch, url: string, init: RequestInit, label: string): Promise<unknown> {
  const response = await fetchImpl(url, init);
  const body = await response.text();
  if (!response.ok) {
    throw new UsageHttpError(label, response.status, body);
  }
  try {
    return body.trim() ? JSON.parse(body) : {};
  } catch {
    throw new Error(`${label} returned invalid JSON.`);
  }
}

function zhipuUsageOrigin(baseUrl: string): string {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error("Unsupported Zhipu base URL.");
  }
  if (!ZHIPU_USAGE_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`Unsupported Zhipu usage host: ${url.hostname}.`);
  }
  return url.origin;
}

function zhipuUsageWindow(now: Date): { startTime: string; endTime: string } {
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, now.getHours(), 0, 0, 0);
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 59, 59, 999);
  return {
    startTime: formatDateTime(startDate),
    endTime: formatDateTime(endDate)
  };
}

function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function extractData(value: unknown): unknown {
  return isRecord(value) && "data" in value ? value.data : value;
}

function zhipuQuotaMetrics(quotaLimit: unknown): UsageMetric[] {
  if (!isRecord(quotaLimit) || !Array.isArray(quotaLimit.limits)) {
    return [];
  }

  return quotaLimit.limits.filter(isRecord).map((item) => {
    const type = stringValue(item.type) || "Quota";
    const percentage = stringValue(item.percentage);
    const currentValue = stringValue(item.currentValue);
    const usage = stringValue(item.usage);
    const detail = [currentValue && `current: ${currentValue}`, usage && `limit: ${usage}`].filter(Boolean).join(", ");

    return {
      label: readableQuotaType(type),
      value: percentage ? formatPercentage(percentage) : detail || "returned",
      detail: detail || undefined
    };
  });
}

function readableQuotaType(type: string): string {
  if (type === "TOKENS_LIMIT") {
    return "Token usage (5h)";
  }
  if (type === "TIME_LIMIT") {
    return "MCP usage (1 month)";
  }
  return type;
}

function formatPercentage(value: string): string {
  return value.endsWith("%") ? value : `${value}%`;
}

function addMetric(metrics: UsageMetric[], label: string, value: unknown): void {
  const normalized = stringValue(value);
  if (normalized) {
    metrics.push({ label, value: normalized });
  }
}

function stringValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function formatUsageError(error: unknown): string {
  if (isAbortError(error)) {
    return "Usage query timed out.";
  }
  if (error instanceof UsageHttpError) {
    const body = oneLine(error.body);
    return `${error.label} failed with HTTP ${error.status}${body ? `: ${body}` : ""}`;
  }
  return error instanceof Error ? error.message : String(error);
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.host);
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

class UsageHttpError extends Error {
  public constructor(
    public readonly label: string,
    public readonly status: number,
    public readonly body: string
  ) {
    super(`${label} failed with HTTP ${status}.`);
  }
}
