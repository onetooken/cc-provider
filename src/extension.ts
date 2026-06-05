import * as vscode from "vscode";
import * as path from "node:path";
import { PROVIDER_PRESETS, configFromPreset, getPreset } from "./presets";
import { CORE_MANAGED_ENV_KEYS, getClaudeSettingsPath, readClaudeSettings, writeClaudeSettings } from "./settings";
import { EditableProviderConfig } from "./types";
import { getWebviewHtml } from "./webview";

const CONFIGS_KEY = "ccProvider.configs";
const ACTIVE_PROVIDER_KEY = "ccProvider.activeProvider";
const APPLIED_PROVIDER_KEY = "ccProvider.appliedProvider";
const MANAGED_ENV_KEYS_KEY = "ccProvider.managedEnvKeys";
const SECRET_PREFIX = "ccProvider.authToken.";

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

  public constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true
    };
    webviewView.webview.html = getWebviewHtml(webviewView.webview);
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
    const incoming = parseConfigPayload(payload);
    const configs = this.getConfigs();
    configs[incoming.providerId] = withoutTokenState(incoming);
    await this.context.globalState.update(CONFIGS_KEY, configs);
    await this.context.globalState.update(ACTIVE_PROVIDER_KEY, incoming.providerId);
    await this.saveTokenIfPresent(incoming.providerId, payload);
    await this.postState("配置已保存。");
  }

  private async applyConfig(payload: unknown): Promise<void> {
    const incoming = parseConfigPayload(payload);
    const configs = this.getConfigs();
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
    await this.postState(`已应用到 ${getClaudeSettingsPath()}。`);
    void vscode.window.showInformationMessage(
      result.backupPath ? `CC Provider 已应用配置，备份已创建。` : "CC Provider 已应用配置。"
    );
  }

  private async addProvider(): Promise<void> {
    const configs = this.getConfigs();
    const id = `custom-${Date.now()}`;
    configs[id] = {
      providerId: id,
      displayName: "Custom Provider",
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
      enableAutoMode: true,
      enableAutoTheme: true
    };
    await this.context.globalState.update(CONFIGS_KEY, configs);
    await this.context.globalState.update(ACTIVE_PROVIDER_KEY, id);
    await this.postState("已新增自定义 Provider。");
  }

  private async deleteProvider(payload: unknown): Promise<void> {
    const providerId = isRecord(payload) && typeof payload.providerId === "string" ? payload.providerId : undefined;
    if (!providerId) {
      throw new Error("找不到要删除的 Provider。");
    }
    if (getPreset(providerId)) {
      throw new Error("内置 Provider 不能删除，可以恢复默认值。");
    }
    const configs = this.getConfigs();
    delete configs[providerId];
    await this.context.secrets.delete(secretKey(providerId));
    await this.context.globalState.update(CONFIGS_KEY, configs);
    await this.context.globalState.update(ACTIVE_PROVIDER_KEY, PROVIDER_PRESETS[0].id);
    await this.postState("已删除自定义 Provider。");
  }

  private async resetProvider(payload: unknown): Promise<void> {
    const providerId = isRecord(payload) && typeof payload.providerId === "string" ? payload.providerId : undefined;
    const preset = providerId ? getPreset(providerId) : undefined;
    if (!preset) {
      throw new Error("找不到要重置的提供商预置。");
    }
    const configs = this.getConfigs();
    configs[preset.id] = configFromPreset(preset);
    await this.context.globalState.update(CONFIGS_KEY, configs);
    await this.postState("已恢复为默认值。");
  }

  private async postState(status?: string): Promise<void> {
    const configs = this.getConfigs();
    await this.context.globalState.update(CONFIGS_KEY, configs);
    const activeProvider = this.context.globalState.get<string>(ACTIVE_PROVIDER_KEY, PROVIDER_PRESETS[0].id);
    const appliedProvider = this.context.globalState.get<string | undefined>(APPLIED_PROVIDER_KEY);
    const tokenStatus = Object.fromEntries(
      await Promise.all(
        Object.keys(configs).map(async (providerId) => [providerId, Boolean(await this.context.secrets.get(secretKey(providerId)))])
      )
    );
    const read = await readClaudeSettings(getClaudeSettingsPath());
    const settingsPreview = read.settings ? JSON.stringify(read.settings, null, 2) : read.error ?? "";

    await this.postMessage({
      type: "state",
      payload: {
        presets: PROVIDER_PRESETS,
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

  private getConfigs(): Record<string, EditableProviderConfig> {
    const saved = this.context.globalState.get<Record<string, EditableProviderConfig>>(CONFIGS_KEY, {});
    const configs: Record<string, EditableProviderConfig> = { ...saved };
    for (const preset of PROVIDER_PRESETS) {
      configs[preset.id] = migrateBuiltinConfig(saved[preset.id] ?? configFromPreset(preset));
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
        description: "用户自定义 Provider。",
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

function parseConfigPayload(payload: unknown): EditableProviderConfig {
  if (!isRecord(payload)) {
    throw new Error("配置格式无效。");
  }
  const providerId = requiredString(payload.providerId, "providerId");
  return {
    providerId,
    displayName: requiredString(payload.displayName, "displayName"),
    baseUrl: requiredString(payload.baseUrl, "baseUrl"),
    models: isRecord(payload.models) ? stringRecord(payload.models) : {},
    customEnv: isRecord(payload.customEnv) ? stringRecord(payload.customEnv, new Set(CORE_MANAGED_ENV_KEYS)) : {},
    maxEffort: Boolean(payload.maxEffort),
    disableClaudeAttribution: payload.disableClaudeAttribution !== false,
    disableNonessentialTraffic: payload.disableNonessentialTraffic !== false,
    enableAutoMode: payload.enableAutoMode !== false,
    enableAutoTheme: payload.enableAutoTheme !== false
  };
}

function withoutTokenState(config: EditableProviderConfig): EditableProviderConfig {
  return { ...sanitizeConfig(config), tokenConfigured: undefined };
}

function migrateBuiltinConfig(config: EditableProviderConfig): EditableProviderConfig {
  const sanitized = sanitizeConfig(config);
  if (config.providerId === "deepseek") {
    return {
      ...sanitized,
      models: replaceModelDefaults(sanitized.models, {
        "deepseek-v4-flash": "deepseek-v4-flash[1m]"
      })
    };
  }
  if (config.providerId === "mimo") {
    return {
      ...sanitized,
      models: replaceModelDefaults(sanitized.models, {
        "mimo-v2.5-pro": "mimo-v2.5-pro[1m]",
        "mimo-v2.5": "mimo-v2.5[1m]"
      })
    };
  }
  return sanitized;
}

function sanitizeConfig(config: EditableProviderConfig): EditableProviderConfig {
  return {
    ...config,
    customEnv: removeManagedCustomEnv(config.customEnv ?? {}),
    disableClaudeAttribution: config.disableClaudeAttribution !== false,
    disableNonessentialTraffic: config.disableNonessentialTraffic !== false,
    enableAutoMode: config.enableAutoMode !== false,
    enableAutoTheme: config.enableAutoTheme !== false
  };
}

function removeManagedCustomEnv(customEnv: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(customEnv).filter(([key]) => !CORE_MANAGED_ENV_KEYS.includes(key)));
}

function replaceModelDefaults(
  models: EditableProviderConfig["models"],
  replacements: Record<string, string>
): EditableProviderConfig["models"] {
  return {
    model: replaceDefaultModel(models.model, replacements),
    opus: replaceDefaultModel(models.opus, replacements),
    sonnet: replaceDefaultModel(models.sonnet, replacements),
    haiku: replaceDefaultModel(models.haiku, replacements),
    subagent: replaceDefaultModel(models.subagent, replacements)
  };
}

function replaceDefaultModel(value: string | undefined, replacements: Record<string, string>): string | undefined {
  if (!value) {
    return value;
  }
  return replacements[value] ?? value;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} 不能为空。`);
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
