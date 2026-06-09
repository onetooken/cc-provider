import * as vscode from "vscode";
import * as path from "node:path";
import { PROVIDER_PRESETS, configFromPreset, getPreset, migrateBuiltinModels } from "./presets";
import {
  CORE_MANAGED_ENV_KEYS,
  getClaudeSettingsPath,
  readClaudeSettings,
  redactSettingsForPreview,
  writeClaudeSettings
} from "./settings";
import { EditableProviderConfig, PermissionDefaultMode } from "./types";
import { getWebviewHtml } from "./webview";
import { AppMessages, formatMessage, getLocale, getMessages } from "./i18n";

const CONFIGS_KEY = "ccProvider.configs";
const CONFIG_SCHEMA_VERSION_KEY = "ccProvider.configSchemaVersion";
const ACTIVE_PROVIDER_KEY = "ccProvider.activeProvider";
const APPLIED_PROVIDER_KEY = "ccProvider.appliedProvider";
const MANAGED_ENV_KEYS_KEY = "ccProvider.managedEnvKeys";
const SECRET_PREFIX = "ccProvider.authToken.";
const CURRENT_CONFIG_SCHEMA_VERSION = 1;

export function activate(context: vscode.ExtensionContext): void {
  const provider = new CcProviderViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("cc-provider.view", provider, {
      webviewOptions: { retainContextWhenHidden: true }
    }),
    vscode.commands.registerCommand("cc-provider.openSettingsFile", async () => {
      await openClaudeSettingsFile();
    })
  );
}

export function deactivate(): void {
  // Nothing to clean up.
}

class CcProviderViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private readonly locale = getLocale(vscode.env.language);
  private readonly messages = getMessages(this.locale);

  public constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true
    };
    webviewView.webview.html = getWebviewHtml(webviewView.webview, this.locale, this.messages);
    webviewView.webview.onDidReceiveMessage((message) => this.handleMessage(message));
  }

  private async handleMessage(message: { type: string; payload?: unknown }): Promise<void> {
    try {
      switch (message.type) {
        case "ready":
          await this.postState();
          break;
        case "saveConfig":
          await this.saveConfig(message.payload);
          break;
        case "applyConfig":
          await this.applyConfig(message.payload);
          break;
        case "addProvider":
          await this.addProvider();
          break;
        case "deleteProvider":
          await this.deleteProvider(message.payload);
          break;
        case "resetProvider":
          await this.resetProvider(message.payload);
          break;
        case "revealToken":
          await this.revealToken(message.payload);
          break;
        case "openSettings":
          await openClaudeSettingsFile();
          break;
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage(messageText);
      await this.postMessage({ type: "error", payload: messageText });
    }
  }

  private async saveConfig(payload: unknown): Promise<void> {
    const incoming = parseConfigPayload(payload, this.messages);
    const configs = await this.getConfigs();
    configs[incoming.providerId] = withoutTokenState(incoming);
    await this.context.globalState.update(CONFIGS_KEY, configs);
    await this.context.globalState.update(ACTIVE_PROVIDER_KEY, incoming.providerId);
    await this.saveTokenIfPresent(incoming.providerId, payload);
    await this.postState(this.messages.savedNotApplied);
  }

  private async applyConfig(payload: unknown): Promise<void> {
    const incoming = parseConfigPayload(payload, this.messages);
    const configs = await this.getConfigs();
    configs[incoming.providerId] = withoutTokenState(incoming);
    await this.context.globalState.update(CONFIGS_KEY, configs);
    await this.context.globalState.update(ACTIVE_PROVIDER_KEY, incoming.providerId);
    await this.saveTokenIfPresent(incoming.providerId, payload);

    const token = await this.context.secrets.get(secretKey(incoming.providerId));
    const previousManagedEnvKeys = this.context.globalState.get<string[]>(MANAGED_ENV_KEYS_KEY, []);
    const result = await writeClaudeSettings(
      {
        config: incoming,
        authToken: token,
        previousManagedEnvKeys
      },
      getClaudeSettingsPath()
    );
    await this.context.globalState.update(MANAGED_ENV_KEYS_KEY, result.managedEnvKeys);
    await this.context.globalState.update(APPLIED_PROVIDER_KEY, incoming.providerId);
    await this.postState(formatMessage(this.messages.appliedToPath, { path: getClaudeSettingsPath() }));
    void vscode.window.showInformationMessage(
      result.backupPath
        ? formatMessage(this.messages.appliedConfigWithBackup, { path: result.backupPath })
        : this.messages.appliedConfig
    );
  }

  private async addProvider(): Promise<void> {
    const configs = await this.getConfigs();
    const id = `custom-${Date.now()}`;
    configs[id] = {
      providerId: id,
      displayName: this.messages.customProvider,
      baseUrl: "https://example.com/anthropic",
      models: {
        model: "custom-model",
        opus: "custom-model",
        sonnet: "custom-model",
        haiku: "custom-model",
        subagent: "custom-model"
      },
      customEnv: {},
      maxEffort: false,
      disableClaudeAttribution: true,
      disableNonessentialTraffic: true,
      permissionDefaultMode: "none",
      enableAutoTheme: true
    };
    await this.context.globalState.update(CONFIGS_KEY, configs);
    await this.context.globalState.update(ACTIVE_PROVIDER_KEY, id);
    await this.postState(this.messages.configSaved);
  }

  private async deleteProvider(payload: unknown): Promise<void> {
    const providerId = isRecord(payload) && typeof payload.providerId === "string" ? payload.providerId : undefined;
    if (!providerId) {
      throw new Error(this.messages.noProviderToDelete);
    }
    if (getPreset(providerId)) {
      throw new Error(this.messages.providerCannotDelete);
    }
    const configs = await this.getConfigs();
    const providerName = configs[providerId]?.displayName || providerId;
    const confirmed = await vscode.window.showWarningMessage(
      formatMessage(this.messages.confirmDelete, { name: providerName }),
      { modal: true },
      this.messages.confirmDeleteButton
    );
    if (confirmed !== this.messages.confirmDeleteButton) {
      await this.postState();
      return;
    }
    delete configs[providerId];
    await this.context.secrets.delete(secretKey(providerId));
    await this.context.globalState.update(CONFIGS_KEY, configs);
    await this.context.globalState.update(ACTIVE_PROVIDER_KEY, PROVIDER_PRESETS[0].id);
    if (this.context.globalState.get<string | undefined>(APPLIED_PROVIDER_KEY) === providerId) {
      await this.context.globalState.update(APPLIED_PROVIDER_KEY, undefined);
    }
    await this.postState(this.messages.providerDeleted);
  }

  private async resetProvider(payload: unknown): Promise<void> {
    const providerId = isRecord(payload) && typeof payload.providerId === "string" ? payload.providerId : undefined;
    const preset = providerId ? getPreset(providerId) : undefined;
    if (!preset) {
      throw new Error(this.messages.noPresetFound);
    }
    const configs = await this.getConfigs();
    configs[preset.id] = configFromPreset(preset);
    await this.context.globalState.update(CONFIGS_KEY, configs);
    await this.postState(this.messages.defaultSettingsRestored);
  }

  private async revealToken(payload: unknown): Promise<void> {
    const providerId = isRecord(payload) && typeof payload.providerId === "string" ? payload.providerId : undefined;
    if (!providerId) {
      throw new Error(this.messages.noProviderToDelete);
    }
    const token = await this.context.secrets.get(secretKey(providerId));
    if (!token) {
      throw new Error(this.messages.tokenUnsaved);
    }
    await this.postMessage({ type: "token", payload: { providerId, token } });
  }

  private async postState(status?: string): Promise<void> {
    const configs = await this.getConfigs();
    await this.context.globalState.update(CONFIGS_KEY, configs);
    const activeProvider = this.context.globalState.get<string>(ACTIVE_PROVIDER_KEY, PROVIDER_PRESETS[0].id);
    const appliedProvider = this.context.globalState.get<string | undefined>(APPLIED_PROVIDER_KEY);
    const tokenStatus = Object.fromEntries(
      await Promise.all(
        Object.keys(configs).map(async (providerId) => [providerId, Boolean(await this.context.secrets.get(secretKey(providerId)))])
      )
    );
    const read = await readClaudeSettings(getClaudeSettingsPath());
    const settingsPreview = read.settings ? JSON.stringify(redactSettingsForPreview(read.settings), null, 2) : read.error ?? "";

    await this.postMessage({
      type: "state",
      payload: {
        presets: PROVIDER_PRESETS,
        locale: this.locale,
        messages: this.messages,
        providers: this.getProviderList(configs),
        configs,
        activeProvider,
        appliedProvider,
        tokenStatus,
        settingsPath: getClaudeSettingsPath(),
        settingsError: read.error,
        settingsPreview,
        status
      }
    });
  }

  private async getConfigs(): Promise<Record<string, EditableProviderConfig>> {
    const saved = this.context.globalState.get<Record<string, EditableProviderConfig>>(CONFIGS_KEY, {});
    const configSchemaVersion = this.context.globalState.get<number>(CONFIG_SCHEMA_VERSION_KEY, 0);
    const shouldMigrateConfig = configSchemaVersion < CURRENT_CONFIG_SCHEMA_VERSION;
    const configs: Record<string, EditableProviderConfig> = { ...saved };
    for (const preset of PROVIDER_PRESETS) {
      configs[preset.id] = normalizeStoredConfig(saved[preset.id] ?? configFromPreset(preset), shouldMigrateConfig);
    }
    if (shouldMigrateConfig) {
      await this.context.globalState.update(CONFIGS_KEY, configs);
      await this.context.globalState.update(CONFIG_SCHEMA_VERSION_KEY, CURRENT_CONFIG_SCHEMA_VERSION);
    }
    return configs;
  }

  private getProviderList(configs: Record<string, EditableProviderConfig>): Array<{
    id: string;
    name: string;
    description: string;
    baseUrl: string;
    isBuiltin: boolean;
  }> {
    const builtinIds = new Set(PROVIDER_PRESETS.map((preset) => preset.id));
    const builtin = PROVIDER_PRESETS.map((preset) => {
      const config = configs[preset.id] ?? configFromPreset(preset);
      return {
        id: preset.id,
        name: config.displayName || preset.name,
        description: preset.description,
        baseUrl: config.baseUrl || preset.baseUrl,
        isBuiltin: true
      };
    });
    const custom = Object.values(configs)
      .filter((config) => !builtinIds.has(config.providerId))
      .map((config) => ({
        id: config.providerId,
        name: config.displayName,
        description: this.messages.customProviderDescription,
        baseUrl: config.baseUrl,
        isBuiltin: false
      }));
    return [...builtin, ...custom];
  }

  private async saveTokenIfPresent(providerId: string, payload: unknown): Promise<void> {
    if (!isRecord(payload) || typeof payload.authToken !== "string") {
      return;
    }
    const token = payload.authToken.trim();
    if (token.length > 0) {
      await this.context.secrets.store(secretKey(providerId), token);
    }
  }

  private async postMessage(message: unknown): Promise<void> {
    await this.view?.webview.postMessage(message);
  }
}

async function openClaudeSettingsFile(): Promise<void> {
  const uri = vscode.Uri.file(getClaudeSettingsPath());
  try {
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
  } catch {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(getClaudeSettingsPath())));
    await vscode.workspace.fs.writeFile(uri, Buffer.from("{}\n", "utf8"));
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
  }
}

function parseConfigPayload(payload: unknown, messages: AppMessages): EditableProviderConfig {
  if (!isRecord(payload)) {
    throw new Error(messages.configFormatInvalid);
  }
  const providerId = requiredString(payload.providerId, "providerId", messages);
  return {
    providerId,
    displayName: requiredString(payload.displayName, "displayName", messages),
    baseUrl: requiredString(payload.baseUrl, "baseUrl", messages),
    models: isRecord(payload.models) ? stringRecord(payload.models) : {},
    customEnv: isRecord(payload.customEnv) ? stringRecord(payload.customEnv, new Set(CORE_MANAGED_ENV_KEYS)) : {},
    maxEffort: Boolean(payload.maxEffort),
    disableClaudeAttribution: payload.disableClaudeAttribution !== false,
    disableNonessentialTraffic: payload.disableNonessentialTraffic !== false,
    permissionDefaultMode: normalizePermissionDefaultMode(payload.permissionDefaultMode, payload.enableAutoMode),
    enableAutoTheme: payload.enableAutoTheme !== false
  };
}

function withoutTokenState(config: EditableProviderConfig): EditableProviderConfig {
  return { ...sanitizeConfig(config), tokenConfigured: undefined };
}

function normalizeStoredConfig(config: EditableProviderConfig, migrateModels: boolean): EditableProviderConfig {
  const sanitized = sanitizeConfig(config);
  if (!migrateModels) {
    return sanitized;
  }
  return { ...sanitized, models: migrateBuiltinModels(sanitized.providerId, sanitized.models) };
}

function sanitizeConfig(config: EditableProviderConfig): EditableProviderConfig {
  const legacyConfig = config as EditableProviderConfig & { enableAutoMode?: unknown };
  return {
    ...config,
    customEnv: removeManagedCustomEnv(config.customEnv ?? {}),
    disableClaudeAttribution: config.disableClaudeAttribution !== false,
    disableNonessentialTraffic: config.disableNonessentialTraffic !== false,
    permissionDefaultMode: normalizePermissionDefaultMode(config.permissionDefaultMode, legacyConfig.enableAutoMode),
    enableAutoTheme: config.enableAutoTheme !== false
  };
}

function normalizePermissionDefaultMode(value: unknown, legacyEnableAutoMode?: unknown): PermissionDefaultMode {
  if (value === "none" || value === "auto" || value === "bypassPermissions") {
    return value;
  }
  return legacyEnableAutoMode === true ? "auto" : "none";
}

function removeManagedCustomEnv(customEnv: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(customEnv).filter(([key]) => !CORE_MANAGED_ENV_KEYS.includes(key)));
}

function requiredString(value: unknown, field: string, messages: AppMessages): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(formatMessage(messages.requiredField, { field }));
  }
  return value.trim();
}

function stringRecord(value: Record<string, unknown>, blockedKeys = new Set<string>()): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key.trim().length > 0)
      .filter(([key]) => !blockedKeys.has(key.trim()))
      .map(([key, item]) => [key.trim(), String(item ?? "").trim()])
  );
}

function secretKey(providerId: string): string {
  return `${SECRET_PREFIX}${providerId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
