export type AppLocale = "en" | "zh-cn";

export interface AppMessages {
  addProvider: string;
  advanced: string;
  advancedModelMapping: string;
  apiToken: string;
  apply: string;
  applied: string;
  appliedConfig: string;
  appliedConfigWithBackup: string;
  appliedToPath: string;
  baseUrl: string;
  behavior: string;
  confirmDelete: string;
  confirmDeleteButton: string;
  connectionConfig: string;
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
  enableAllModelSlots: string;
  envKeyPlaceholder: string;
  envValuePlaceholder: string;
  interfaceGroup: string;
  modelSlots: string;
  modelConfig: string;
  noPresetFound: string;
  noProviderToDelete: string;
  openSettings: string;
  pending: string;
  permissionDefaultMode: string;
  permissionDefaultModeAuto: string;
  permissionDefaultModeBypass: string;
  permissionDefaultModeNone: string;
  privacy: string;
  providerCannotDelete: string;
  providerDeleted: string;
  providerTitle: string;
  quota: string;
  quotaPlaceholder: string;
  usageExperimental: string;
  usageExternal: string;
  usageLastFetched: string;
  usageLoading: string;
  usageMetricApiAvailable: string;
  usageMetricCurrentLimit: string;
  usageMetricCurrencyGranted: string;
  usageMetricCurrencyToppedUp: string;
  usageMetricCurrencyTotal: string;
  usageMetricMcpUsage: string;
  usageMetricTokenUsage: string;
  usageMissingToken: string;
  usageNoMetrics: string;
  usageNotFetched: string;
  usageOpenConsole: string;
  usageQueryFailed: string;
  usageRefresh: string;
  usageLink: string;
  usageLinkPlaceholder: string;
  usageUnsupported: string;
  usageValueNo: string;
  usageValueYes: string;
  requiredField: string;
  reset: string;
  save: string;
  saveAndApply: string;
  savedNotApplied: string;
  settingsPreview: string;
  themeAuto: string;
  tokenSaved: string;
  tokenShow: string;
  tokenHide: string;
  tokenUnsaved: string;
  unsavedChanges: string;
}

const EN: AppMessages = {
  addProvider: "Add Provider",
  advanced: "Advanced",
  advancedModelMapping: "Advanced model mapping",
  apiToken: "API Token",
  apply: "Apply",
  applied: "Applied",
  appliedConfig: "CC Provider applied the configuration.",
  appliedConfigWithBackup: "CC Provider applied the configuration. Backup: {path}",
  appliedToPath: "Applied to {path}.",
  baseUrl: "Base URL",
  behavior: "Behavior",
  confirmDelete: "Delete {name}? This cannot be undone.",
  confirmDeleteButton: "Delete Provider",
  connectionConfig: "Connection",
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
  enableAllModelSlots: "Use default model for all model slots",
  envKeyPlaceholder: "KEY",
  envValuePlaceholder: "value",
  interfaceGroup: "Interface",
  modelSlots: "Model slots",
  modelConfig: "Models",
  noPresetFound: "Provider preset not found.",
  noProviderToDelete: "No provider selected for deletion.",
  openSettings: "Open settings",
  pending: "Pending",
  permissionDefaultMode: "Permission default mode",
  permissionDefaultModeAuto: "auto",
  permissionDefaultModeBypass: "bypassPermissions",
  permissionDefaultModeNone: "Do not manage",
  privacy: "Privacy",
  providerCannotDelete: "Built-in providers cannot be deleted. Restore defaults instead.",
  providerDeleted: "Custom provider deleted.",
  providerTitle: "Current Provider",
  quota: "Usage",
  quotaPlaceholder: "This version does not support querying provider API usage.",
  usageExperimental: "Experimental",
  usageExternal: "Open the provider console to view usage.",
  usageLastFetched: "Last refreshed: {time}",
  usageLoading: "Refreshing...",
  usageMetricApiAvailable: "API available",
  usageMetricCurrentLimit: "current: {current}, limit: {limit}",
  usageMetricCurrencyGranted: "{currency} granted",
  usageMetricCurrencyToppedUp: "{currency} topped up",
  usageMetricCurrencyTotal: "{currency} total",
  usageMetricMcpUsage: "MCP usage (1 month)",
  usageMetricTokenUsage: "Token usage (5h)",
  usageMissingToken: "Save an API Token before querying usage.",
  usageNoMetrics: "No usage metrics returned.",
  usageNotFetched: "Click refresh to query provider usage.",
  usageOpenConsole: "Open console",
  usageQueryFailed: "Usage query failed",
  usageRefresh: "Refresh",
  usageLink: "Usage link",
  usageLinkPlaceholder: "Enter an http/https link",
  usageUnsupported: "This provider does not support usage query yet.",
  usageValueNo: "No",
  usageValueYes: "Yes",
  requiredField: "{field} is required.",
  reset: "Restore defaults",
  save: "Save only",
  saveAndApply: "Save and Apply",
  savedNotApplied: "Saved. Not applied to settings yet.",
  settingsPreview: "Current settings.json",
  themeAuto: "Use auto theme",
  tokenSaved: "Token saved",
  tokenShow: "Show",
  tokenHide: "Hide",
  tokenUnsaved: "Token not saved",
  unsavedChanges: "Unsaved changes. Save or apply to take effect."
};

const ZH_CN: AppMessages = {
  addProvider: "新增 Provider",
  advanced: "高级",
  advancedModelMapping: "高级模型映射",
  apiToken: "API Token",
  apply: "应用",
  applied: "已应用",
  appliedConfig: "CC Provider 已应用配置。",
  appliedConfigWithBackup: "CC Provider 已应用配置。备份：{path}",
  appliedToPath: "已应用到 {path}。",
  baseUrl: "Base URL",
  behavior: "行为",
  confirmDelete: "确认删除 {name}？此操作无法撤销。",
  confirmDeleteButton: "删除 Provider",
  connectionConfig: "连接配置",
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
  enableAllModelSlots: "所有模型槽位使用默认模型",
  envKeyPlaceholder: "KEY",
  envValuePlaceholder: "value",
  interfaceGroup: "界面",
  modelSlots: "模型槽位",
  modelConfig: "模型配置",
  noPresetFound: "找不到要重置的提供商预置。",
  noProviderToDelete: "找不到要删除的 Provider。",
  openSettings: "打开 settings",
  pending: "待应用",
  permissionDefaultMode: "权限默认模式",
  permissionDefaultModeAuto: "auto",
  permissionDefaultModeBypass: "bypassPermissions",
  permissionDefaultModeNone: "不管理",
  privacy: "隐私",
  providerCannotDelete: "内置 Provider 不能删除，可以恢复默认值。",
  providerDeleted: "已删除自定义 Provider。",
  providerTitle: "当前 Provider",
  quota: "用量",
  quotaPlaceholder: "当前版本暂不支持查询厂商 API 用量。",
  usageExperimental: "实验性",
  usageExternal: "请打开厂商控制台查看用量。",
  usageLastFetched: "最近刷新：{time}",
  usageLoading: "刷新中...",
  usageMetricApiAvailable: "API 可用",
  usageMetricCurrentLimit: "当前：{current}，上限：{limit}",
  usageMetricCurrencyGranted: "{currency} 剩余赠金",
  usageMetricCurrencyToppedUp: "{currency} 剩余充值余额",
  usageMetricCurrencyTotal: "{currency} 剩余总余额",
  usageMetricMcpUsage: "MCP 用量（1 个月）",
  usageMetricTokenUsage: "Token 用量（5 小时）",
  usageMissingToken: "请先保存 API Token，再查询用量。",
  usageNoMetrics: "厂商未返回可展示的用量指标。",
  usageNotFetched: "点击刷新查询厂商用量。",
  usageOpenConsole: "打开控制台",
  usageQueryFailed: "用量查询失败",
  usageRefresh: "刷新",
  usageLink: "用量链接",
  usageLinkPlaceholder: "请输入 http/https 链接",
  usageUnsupported: "当前 Provider 暂不支持用量查询。",
  usageValueNo: "否",
  usageValueYes: "是",
  requiredField: "{field} 不能为空。",
  reset: "恢复默认",
  save: "仅保存",
  saveAndApply: "保存并应用",
  savedNotApplied: "已保存，尚未应用到 settings。",
  settingsPreview: "当前 settings.json",
  themeAuto: "主题跟随 auto",
  tokenSaved: "Token 已保存",
  tokenShow: "显示",
  tokenHide: "隐藏",
  tokenUnsaved: "Token 未保存",
  unsavedChanges: "有未保存更改，保存或应用后才会生效。"
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
