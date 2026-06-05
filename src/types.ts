export type ProviderId = "deepseek" | "zhipu" | "mimo" | string;

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
  usageStatus: "placeholder" | "available";
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
  enableAutoMode: boolean;
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
