export type AppLocale = "en" | "zh-cn";

export interface AppMessages {
  addProvider: string;
  apiToken: string;
  apply: string;
  applied: string;
  appliedConfig: string;
  appliedConfigWithBackup: string;
  appliedToPath: string;
  autoMode: string;
  baseUrl: string;
  configFormatInvalid: string;
  configSaved: string;
  customEnv: string;
  customProvider: string;
  customProviderDescription: string;
  defaultSettingsRestored: string;
  delete: string;
  deleteEnv: string;
  disableAttribution: string;
  disableNonessentialTraffic: string;
  displayName: string;
  envKeyPlaceholder: string;
  envValuePlaceholder: string;
  modelSlots: string;
  noPresetFound: string;
  noProviderToDelete: string;
  openSettings: string;
  pending: string;
  providerCannotDelete: string;
  providerDeleted: string;
  providerTitle: string;
  quota: string;
  quotaPlaceholder: string;
  requiredField: string;
  reset: string;
  save: string;
  settingsPreview: string;
  themeAuto: string;
  tokenSaved: string;
  tokenUnsaved: string;
  tokenPlaceholder: string;
}

const EN: AppMessages = {
  addProvider: "Add Provider",
  apiToken: "API Token",
  apply: "Apply",
  applied: "Applied",
  appliedConfig: "CC Provider applied the configuration.",
  appliedConfigWithBackup: "CC Provider applied the configuration and created a backup.",
  appliedToPath: "Applied to {path}.",
  autoMode: "Enable auto mode by default",
  baseUrl: "Base URL",
  configFormatInvalid: "Invalid configuration format.",
  configSaved: "Configuration saved.",
  customEnv: "Custom env",
  customProvider: "Custom Provider",
  customProviderDescription: "User-defined provider.",
  defaultSettingsRestored: "Default values restored.",
  delete: "Delete",
  deleteEnv: "Delete",
  disableAttribution: "Remove cc co-author notice",
  disableNonessentialTraffic: "Disable nonessential traffic",
  displayName: "Name",
  envKeyPlaceholder: "KEY",
  envValuePlaceholder: "value",
  modelSlots: "Model slots",
  noPresetFound: "Provider preset not found.",
  noProviderToDelete: "No provider selected for deletion.",
  openSettings: "Open settings",
  pending: "Pending",
  providerCannotDelete: "Built-in providers cannot be deleted. Restore defaults instead.",
  providerDeleted: "Custom provider deleted.",
  providerTitle: "Provider",
  quota: "Usage",
  quotaPlaceholder: "Quota and usage integrations are reserved for a future version.",
  requiredField: "{field} is required.",
  reset: "Restore defaults",
  save: "Save",
  settingsPreview: "Current settings.json",
  themeAuto: "Use auto theme",
  tokenSaved: "Token saved",
  tokenUnsaved: "Token not saved",
  tokenPlaceholder: "Leave empty to keep the saved token"
};

const ZH_CN: AppMessages = {
  addProvider: "新增 Provider",
  apiToken: "API Token",
  apply: "应用",
  applied: "已应用",
  appliedConfig: "CC Provider 已应用配置。",
  appliedConfigWithBackup: "CC Provider 已应用配置，备份已创建。",
  appliedToPath: "已应用到 {path}。",
  autoMode: "默认开启 auto mode",
  baseUrl: "Base URL",
  configFormatInvalid: "配置格式无效。",
  configSaved: "配置已保存。",
  customEnv: "自定义 env",
  customProvider: "Custom Provider",
  customProviderDescription: "用户自定义 Provider。",
  defaultSettingsRestored: "已恢复为默认值。",
  delete: "删除",
  deleteEnv: "删除",
  disableAttribution: "去除 cc co-author 声明",
  disableNonessentialTraffic: "禁用非必要流量",
  displayName: "名称",
  envKeyPlaceholder: "KEY",
  envValuePlaceholder: "value",
  modelSlots: "模型槽位",
  noPresetFound: "找不到要重置的提供商预置。",
  noProviderToDelete: "找不到要删除的 Provider。",
  openSettings: "打开 settings",
  pending: "待应用",
  providerCannotDelete: "内置 Provider 不能删除，可以恢复默认值。",
  providerDeleted: "已删除自定义 Provider。",
  providerTitle: "Provider",
  quota: "用量",
  quotaPlaceholder: "用量限制和使用情况接口已预留，当前版本暂不连接厂商 API。",
  requiredField: "{field} 不能为空。",
  reset: "恢复默认",
  save: "保存",
  settingsPreview: "当前 settings.json",
  themeAuto: "主题跟随 auto",
  tokenSaved: "Token 已保存",
  tokenUnsaved: "Token 未保存",
  tokenPlaceholder: "留空则使用已保存 Token"
};

export function getLocale(language: string): AppLocale {
  const normalized = language.toLowerCase();
  return normalized === "zh-cn" || normalized === "zh-hans" ? "zh-cn" : "en";
}

export function getMessages(locale: AppLocale): AppMessages {
  return locale === "zh-cn" ? ZH_CN : EN;
}

export function formatMessage(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}
