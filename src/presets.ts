import { EditableProviderConfig, ProviderPreset } from "./types";

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek Anthropic-compatible endpoint for Claude Code.",
    baseUrl: "https://api.deepseek.com/anthropic",
    models: {
      model: "deepseek-v4-pro[1m]",
      opus: "deepseek-v4-pro[1m]",
      sonnet: "deepseek-v4-pro[1m]",
      haiku: "deepseek-v4-flash[1m]",
      subagent: "deepseek-v4-flash[1m]"
    },
    defaultEnv: {
      CLAUDE_CODE_EFFORT_LEVEL: "max"
    },
    capabilities: {
      supportsOneMillionContext: true,
      supportsMaxEffort: true
    },
    modelOptions: ["deepseek-v4-pro", "deepseek-v4-flash"],
    usageStatus: "placeholder"
  },
  {
    id: "zhipu",
    name: "Zhipu GLM Coding Plan",
    description: "智谱 GLM Coding Plan 的 Claude Code 兼容配置。",
    baseUrl: "https://open.bigmodel.cn/api/anthropic",
    models: {
      opus: "glm-5.1",
      sonnet: "glm-4.7",
      haiku: "glm-4.5-air"
    },
    defaultEnv: {
      API_TIMEOUT_MS: "3000000",
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1"
    },
    capabilities: {
      supportsOneMillionContext: false,
      supportsMaxEffort: false
    },
    modelOptions: ["glm-5.1", "glm-4.7", "glm-4.5-air"],
    usageStatus: "placeholder"
  },
  {
    id: "mimo",
    name: "Xiaomi MiMo Token Plan",
    description: "Xiaomi MiMo Token Plan 默认值，所有字段都可编辑。",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/anthropic",
    models: {
      model: "mimo-v2.5-pro[1m]",
      opus: "mimo-v2.5-pro[1m]",
      sonnet: "mimo-v2.5-pro[1m]",
      haiku: "mimo-v2.5[1m]",
      subagent: "mimo-v2.5[1m]"
    },
    defaultEnv: {},
    capabilities: {
      supportsOneMillionContext: true,
      supportsMaxEffort: false
    },
    modelOptions: ["mimo-v2.5-pro", "mimo-v2.5"],
    usageStatus: "placeholder"
  }
];

export function configFromPreset(preset: ProviderPreset): EditableProviderConfig {
  return {
    providerId: preset.id,
    displayName: preset.name,
    baseUrl: preset.baseUrl,
    models: { ...preset.models },
    customEnv: { ...preset.defaultEnv },
    maxEffort: preset.defaultEnv.CLAUDE_CODE_EFFORT_LEVEL === "max",
    disableClaudeAttribution: true,
    disableNonessentialTraffic: preset.defaultEnv.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC !== "0",
    enableAutoMode: true
  };
}

export function getPreset(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((preset) => preset.id === id);
}
