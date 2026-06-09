export type ProviderId = "deepseek" | "zhipu" | "mimo" | string;
export type PermissionDefaultMode = "none" | "auto" | "bypassPermissions";
export type UsageAdapterId = "deepseekBalance" | "zhipuCodingPlan";

export type UsageCapability =
  | { kind: "query"; adapter: UsageAdapterId; experimental?: boolean; consoleUrl?: string }
  | { kind: "externalLink"; url: string }
  | { kind: "unsupported"; reason?: string };
export type CustomUsageCapability = Extract<UsageCapability, { kind: "externalLink" | "unsupported" }>;

export type UsageSnapshotStatus = "available" | "externalLink" | "missingToken" | "unsupported" | "error";

export interface ModelSlots {
  model?: string;
  opus?: string;
  sonnet?: string;
  haiku?: string;
  subagent?: string;
}

export interface ProviderCapabilities {
  supportsOneMillionContext: boolean;
  supportsMaxEffort: boolean;
}

export interface ProviderPreset {
  id: ProviderId;
  name: string;
  description: string;
  baseUrl: string;
  models: ModelSlots;
  defaultEnv: Record<string, string>;
  capabilities: ProviderCapabilities;
  modelOptions?: string[];
  usage: UsageCapability;
}

export interface UsageMetric {
  label: string;
  value: string;
  detail?: string;
}

export interface UsageDetail {
  title: string;
  data: unknown;
}

export interface UsageSnapshot {
  providerId: ProviderId;
  status: UsageSnapshotStatus;
  fetchedAt?: string;
  metrics: UsageMetric[];
  message?: string;
  externalUrl?: string;
  experimental?: boolean;
  details?: UsageDetail[];
}

export interface EditableProviderConfig {
  providerId: ProviderId;
  displayName: string;
  baseUrl: string;
  tokenConfigured?: boolean;
  models: ModelSlots;
  customEnv: Record<string, string>;
  maxEffort: boolean;
  disableClaudeAttribution: boolean;
  disableNonessentialTraffic: boolean;
  permissionDefaultMode: PermissionDefaultMode;
  enableAutoTheme: boolean;
  usage?: CustomUsageCapability;
}

export interface ApplySettingsInput {
  config: EditableProviderConfig;
  authToken?: string;
  previousManagedEnvKeys?: string[];
}

export interface ApplySettingsResult {
  settings: Record<string, unknown>;
  managedEnvKeys: string[];
  backupPath?: string;
}

export interface SettingsReadResult {
  path: string;
  exists: boolean;
  settings?: Record<string, unknown>;
  error?: string;
}
