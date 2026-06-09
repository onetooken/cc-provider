import { EditableProviderConfig, ModelSlots, ProviderPreset } from "./types";

const MODEL_SLOT_KEYS = ["model", "opus", "sonnet", "haiku", "subagent"] as const;

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
    usage: { kind: "query", adapter: "deepseekBalance", consoleUrl: "https://platform.deepseek.com/usage" }
  },
  {
    id: "zhipu",
    name: "Zhipu GLM Coding Plan",
    description: "Zhipu GLM Coding Plan Claude Code-compatible configuration.",
    baseUrl: "https://open.bigmodel.cn/api/anthropic",
    models: {
      opus: "glm-5.1",
      sonnet: "glm-5.1",
      haiku: "glm-5.1",
      subagent: "glm-5.1"
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
    usage: {
      kind: "query",
      adapter: "zhipuCodingPlan",
      experimental: true,
      consoleUrl: "https://bigmodel.cn/coding-plan/personal/usage"
    }
  },
  {
    id: "mimo",
    name: "Xiaomi MiMo Token Plan",
    description: "Xiaomi MiMo Token Plan defaults. Every field remains editable.",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/anthropic",
    models: {
      model: "mimo-v2.5-pro[1m]",
      opus: "mimo-v2.5-pro[1m]",
      sonnet: "mimo-v2.5-pro[1m]",
      haiku: "mimo-v2.5-pro[1m]",
      subagent: "mimo-v2.5-pro[1m]"
    },
    defaultEnv: {},
    capabilities: {
      supportsOneMillionContext: true,
      supportsMaxEffort: false
    },
    modelOptions: ["mimo-v2.5-pro", "mimo-v2.5"],
    usage: { kind: "externalLink", url: "https://platform.xiaomimimo.com/console/plan-manage" }
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
    permissionDefaultMode: "none",
    enableAutoTheme: true
  };
}

export function getPreset(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((preset) => preset.id === id);
}

export function migrateBuiltinModels(providerId: string, models: ModelSlots): ModelSlots {
  const preset = getPreset(providerId);
  if (!preset) {
    return { ...models };
  }

  const legacyDefaults = LEGACY_MODEL_DEFAULTS[providerId] ?? [];
  return legacyDefaults.some((legacyModels) => modelSlotsMatch(models, legacyModels)) ? { ...preset.models } : { ...models };
}

const LEGACY_MODEL_DEFAULTS: Record<string, ModelSlots[]> = {
  deepseek: [
    {
      model: "deepseek-v4-pro[1m]",
      opus: "deepseek-v4-pro[1m]",
      sonnet: "deepseek-v4-pro[1m]",
      haiku: "deepseek-v4-flash",
      subagent: "deepseek-v4-flash"
    }
  ],
  zhipu: [
    {
      opus: "glm-4.7",
      sonnet: "glm-4.7",
      haiku: "glm-4.7",
      subagent: "glm-4.7"
    },
    {
      opus: "glm-4.7",
      sonnet: "glm-4.7",
      haiku: "glm-4.5-air",
      subagent: "glm-4.5-air"
    },
    {
      opus: "glm-4.5-air",
      sonnet: "glm-4.5-air",
      haiku: "glm-4.5-air",
      subagent: "glm-4.5-air"
    }
  ],
  mimo: [
    {
      model: "mimo-v2.5-pro",
      opus: "mimo-v2.5-pro",
      sonnet: "mimo-v2.5-pro",
      haiku: "mimo-v2.5-pro",
      subagent: "mimo-v2.5-pro"
    },
    {
      model: "mimo-v2.5",
      opus: "mimo-v2.5",
      sonnet: "mimo-v2.5",
      haiku: "mimo-v2.5",
      subagent: "mimo-v2.5"
    },
    {
      model: "mimo-v2.5[1m]",
      opus: "mimo-v2.5[1m]",
      sonnet: "mimo-v2.5[1m]",
      haiku: "mimo-v2.5[1m]",
      subagent: "mimo-v2.5[1m]"
    }
  ]
};

function modelSlotsMatch(actual: ModelSlots, expected: ModelSlots): boolean {
  return MODEL_SLOT_KEYS.every((key) => (actual[key] ?? "") === (expected[key] ?? ""));
}
