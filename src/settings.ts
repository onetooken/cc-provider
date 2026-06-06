import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { ApplySettingsInput, ApplySettingsResult, EditableProviderConfig, SettingsReadResult } from "./types";

export const CLAUDE_SETTINGS_SCHEMA = "https://json.schemastore.org/claude-code-settings.json";

export const CORE_MANAGED_ENV_KEYS = [
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL",
  "CLAUDE_CODE_EFFORT_LEVEL",
  "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"
];

const DISABLED_ATTRIBUTION = {
  commit: "",
  pr: ""
};

const REDACTED_SECRET = "••••••••••••";
const SECRET_KEY_PATTERN = /token|auth|api[_-]?key|apikey|secret/i;

export function getClaudeSettingsPath(homeDir = os.homedir()): string {
  return path.join(homeDir, ".claude", "settings.json");
}

export async function readClaudeSettings(settingsPath = getClaudeSettingsPath()): Promise<SettingsReadResult> {
  try {
    const text = await fs.readFile(settingsPath, "utf8");
    return {
      path: settingsPath,
      exists: true,
      settings: parseSettingsJson(text)
    };
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return { path: settingsPath, exists: false, settings: {} };
    }
    return { path: settingsPath, exists: true, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function writeClaudeSettings(input: ApplySettingsInput, settingsPath = getClaudeSettingsPath()): Promise<ApplySettingsResult> {
  const read = await readClaudeSettings(settingsPath);
  if (read.error) {
    throw new Error(`Unable to read Claude settings: ${read.error}`);
  }

  const current = read.settings ?? {};
  const result = applyProviderToSettings(current, input);
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });

  let backupPath: string | undefined;
  if (read.exists) {
    backupPath = `${settingsPath}.${timestamp()}.bak`;
    await fs.copyFile(settingsPath, backupPath);
  }

  await fs.writeFile(settingsPath, `${JSON.stringify(result.settings, null, 2)}\n`, "utf8");
  return { ...result, backupPath };
}

export function applyProviderToSettings(
  currentSettings: Record<string, unknown>,
  input: ApplySettingsInput
): ApplySettingsResult {
  const settings = { ...currentSettings };
  settings.$schema = typeof settings.$schema === "string" ? settings.$schema : CLAUDE_SETTINGS_SCHEMA;

  const existingEnv = isRecord(settings.env) ? settings.env : {};
  const env: Record<string, unknown> = { ...existingEnv };
  const envToWrite = buildProviderEnv(input.config, input.authToken);
  const managedKeys = Array.from(new Set([...CORE_MANAGED_ENV_KEYS, ...Object.keys(input.config.customEnv)]));

  for (const key of new Set([...(input.previousManagedEnvKeys ?? []), ...CORE_MANAGED_ENV_KEYS])) {
    if (!(key in envToWrite)) {
      delete env[key];
    }
  }

  for (const [key, value] of Object.entries(envToWrite)) {
    env[key] = value;
  }

  settings.env = env;
  applyAttributionSettings(settings, input.config.disableClaudeAttribution);
  applyPermissionDefaultModeSettings(settings, input.config.enableAutoMode);
  applyThemeSettings(settings, input.config.enableAutoTheme);
  return { settings, managedEnvKeys: managedKeys };
}

export function buildProviderEnv(config: EditableProviderConfig, authToken?: string): Record<string, string> {
  const models = trimModels(config.models);
  const env: Record<string, string> = {
    ANTHROPIC_BASE_URL: config.baseUrl,
    ...stringEntries(config.customEnv)
  };

  if (authToken && authToken.trim()) {
    env.ANTHROPIC_AUTH_TOKEN = authToken.trim();
  }
  if (models.model) {
    env.ANTHROPIC_MODEL = models.model;
  }
  if (models.opus) {
    env.ANTHROPIC_DEFAULT_OPUS_MODEL = models.opus;
  }
  if (models.sonnet) {
    env.ANTHROPIC_DEFAULT_SONNET_MODEL = models.sonnet;
  }
  if (models.haiku) {
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL = models.haiku;
  }
  if (models.subagent) {
    env.CLAUDE_CODE_SUBAGENT_MODEL = models.subagent;
  }

  if (config.maxEffort) {
    env.CLAUDE_CODE_EFFORT_LEVEL = "max";
  } else if (env.CLAUDE_CODE_EFFORT_LEVEL === "max") {
    delete env.CLAUDE_CODE_EFFORT_LEVEL;
  }

  if (config.disableNonessentialTraffic) {
    env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1";
  } else if (env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC === "1") {
    delete env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC;
  }

  return env;
}

function trimModels(models: EditableProviderConfig["models"]): EditableProviderConfig["models"] {
  return {
    model: optionalTrim(models.model),
    opus: optionalTrim(models.opus),
    sonnet: optionalTrim(models.sonnet),
    haiku: optionalTrim(models.haiku),
    subagent: optionalTrim(models.subagent)
  };
}

function optionalTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function applyAttributionSettings(settings: Record<string, unknown>, disabled: boolean): void {
  if (disabled) {
    settings.attribution = { ...DISABLED_ATTRIBUTION };
    settings.includeCoAuthoredBy = false;
    return;
  }

  if (isDisabledAttribution(settings.attribution)) {
    delete settings.attribution;
  }
  if (settings.includeCoAuthoredBy === false) {
    delete settings.includeCoAuthoredBy;
  }
}

function isDisabledAttribution(value: unknown): boolean {
  return isRecord(value) && value.commit === "" && value.pr === "";
}

function applyPermissionDefaultModeSettings(settings: Record<string, unknown>, enableAutoMode: boolean): void {
  const permissions = isRecord(settings.permissions) ? { ...settings.permissions } : {};
  if (enableAutoMode) {
    permissions.defaultMode = "auto";
    settings.permissions = permissions;
    if (settings.defaultMode === "auto") {
      delete settings.defaultMode;
    }
    return;
  }

  if (permissions.defaultMode === "auto") {
    delete permissions.defaultMode;
  }
  if (Object.keys(permissions).length > 0) {
    settings.permissions = permissions;
  } else if (isRecord(settings.permissions)) {
    delete settings.permissions;
  }
  if (settings.defaultMode === "auto") {
    delete settings.defaultMode;
  }
}

function applyThemeSettings(settings: Record<string, unknown>, enableAutoTheme: boolean): void {
  if (enableAutoTheme) {
    settings.theme = "auto";
    return;
  }
  if (settings.theme === "auto") {
    delete settings.theme;
  }
}

export function parseSettingsJson(text: string): Record<string, unknown> {
  const parsed = JSON.parse(text);
  if (!isRecord(parsed)) {
    throw new Error("settings.json must be a JSON object");
  }
  return parsed;
}

export function redactSettingsForPreview(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSettingsForPreview(item));
  }
  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (SECRET_KEY_PATTERN.test(key) && typeof item === "string" && item.length > 0) {
        return [key, REDACTED_SECRET];
      }
      return [key, redactSettingsForPreview(item)];
    })
  );
}

function stringEntries(input: Record<string, string>): Record<string, string> {
  const entries = Object.entries(input)
    .map(([key, value]) => [key.trim(), String(value).trim()] as const)
    .filter(([key]) => key.length > 0);
  return Object.fromEntries(entries);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
