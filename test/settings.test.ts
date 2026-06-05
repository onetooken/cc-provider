import { describe, expect, it } from "vitest";
import { applyProviderToSettings, buildProviderEnv, parseSettingsJson } from "../src/settings";
import { configFromPreset, getPreset } from "../src/presets";
import { EditableProviderConfig } from "../src/types";

describe("provider presets", () => {
  it("maps DeepSeek defaults to Claude Code env keys", () => {
    const preset = getPreset("deepseek");
    expect(preset).toBeTruthy();
    const env = buildProviderEnv(configFromPreset(preset!), "sk-deepseek");

    expect(env).toMatchObject({
      ANTHROPIC_BASE_URL: "https://api.deepseek.com/anthropic",
      ANTHROPIC_AUTH_TOKEN: "sk-deepseek",
      ANTHROPIC_MODEL: "deepseek-v4-pro[1m]",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "deepseek-v4-pro[1m]",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "deepseek-v4-pro[1m]",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "deepseek-v4-flash[1m]",
      CLAUDE_CODE_SUBAGENT_MODEL: "deepseek-v4-flash[1m]",
      CLAUDE_CODE_EFFORT_LEVEL: "max",
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1"
    });
  });

  it("maps Zhipu defaults to editable env values", () => {
    const preset = getPreset("zhipu");
    expect(preset).toBeTruthy();
    const env = buildProviderEnv(configFromPreset(preset!), "sk-zhipu");

    expect(env).toMatchObject({
      ANTHROPIC_BASE_URL: "https://open.bigmodel.cn/api/anthropic",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "glm-5.1",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "glm-4.7",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "glm-4.5-air",
      ANTHROPIC_AUTH_TOKEN: "sk-zhipu",
      API_TIMEOUT_MS: "3000000",
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1"
    });
  });

  it("maps MiMo defaults with default 1M suffixes", () => {
    const preset = getPreset("mimo");
    expect(preset).toBeTruthy();
    const config = configFromPreset(preset!);
    const env = buildProviderEnv(config, "tp-token");

    expect(env).toMatchObject({
      ANTHROPIC_BASE_URL: "https://token-plan-cn.xiaomimimo.com/anthropic",
      ANTHROPIC_MODEL: "mimo-v2.5-pro[1m]",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "mimo-v2.5-pro[1m]",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "mimo-v2.5-pro[1m]",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "mimo-v2.5[1m]",
      CLAUDE_CODE_SUBAGENT_MODEL: "mimo-v2.5[1m]"
    });
  });
});

describe("settings merge", () => {
  it("preserves unknown settings and merges managed env values", () => {
    const config: EditableProviderConfig = {
      providerId: "custom",
      displayName: "Custom",
      baseUrl: "https://example.com/anthropic",
      models: { opus: "custom-opus", sonnet: "custom-sonnet" },
      customEnv: { API_TIMEOUT_MS: "1000" },
      maxEffort: false,
      disableClaudeAttribution: true,
      disableNonessentialTraffic: true,
      enableAutoMode: true
    };

    const result = applyProviderToSettings(
      {
        permissions: { allow: ["Bash(git status)"] },
        env: { KEEP_ME: "yes", ANTHROPIC_BASE_URL: "old" }
      },
      { config, authToken: "secret" }
    );

    expect(result.settings.permissions).toEqual({ allow: ["Bash(git status)"] });
    expect(result.settings.env).toMatchObject({
      KEEP_ME: "yes",
      ANTHROPIC_BASE_URL: "https://example.com/anthropic",
      ANTHROPIC_AUTH_TOKEN: "secret",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "custom-opus",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "custom-sonnet",
      API_TIMEOUT_MS: "1000"
    });
    expect(result.settings.attribution).toEqual({ commit: "", pr: "" });
    expect(result.settings.includeCoAuthoredBy).toBe(false);
    expect(result.settings.defaultMode).toBe("auto");
  });

  it("removes previously managed keys when no longer present", () => {
    const config: EditableProviderConfig = {
      providerId: "zhipu",
      displayName: "Zhipu",
      baseUrl: "https://open.bigmodel.cn/api/anthropic",
      models: { haiku: "glm-4.5-air" },
      customEnv: {},
      maxEffort: false,
      disableClaudeAttribution: false,
      disableNonessentialTraffic: false,
      enableAutoMode: false
    };

    const result = applyProviderToSettings(
      {
        env: {
          KEEP_ME: "yes",
          CLAUDE_CODE_EFFORT_LEVEL: "max",
          CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
          ANTHROPIC_MODEL: "old[1m]"
        }
      },
      {
        config,
        previousManagedEnvKeys: ["CLAUDE_CODE_EFFORT_LEVEL", "ANTHROPIC_MODEL"]
      }
    );

    expect(result.settings.env).toEqual({
      KEEP_ME: "yes",
      ANTHROPIC_BASE_URL: "https://open.bigmodel.cn/api/anthropic",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "glm-4.5-air"
    });
  });

  it("removes plugin disabled attribution when unchecked", () => {
    const config: EditableProviderConfig = {
      providerId: "custom",
      displayName: "Custom",
      baseUrl: "https://example.com/anthropic",
      models: {},
      customEnv: {},
      maxEffort: false,
      disableClaudeAttribution: false,
      disableNonessentialTraffic: true,
      enableAutoMode: false
    };

    const result = applyProviderToSettings(
      {
        attribution: { commit: "", pr: "" },
        includeCoAuthoredBy: false
      },
      { config }
    );

    expect(result.settings.attribution).toBeUndefined();
    expect(result.settings.includeCoAuthoredBy).toBeUndefined();
  });

  it("removes plugin default auto mode when unchecked", () => {
    const config: EditableProviderConfig = {
      providerId: "custom",
      displayName: "Custom",
      baseUrl: "https://example.com/anthropic",
      models: {},
      customEnv: {},
      maxEffort: false,
      disableClaudeAttribution: false,
      disableNonessentialTraffic: false,
      enableAutoMode: false
    };

    const result = applyProviderToSettings({ defaultMode: "auto" }, { config });

    expect(result.settings.defaultMode).toBeUndefined();
  });
});

describe("settings JSON parsing", () => {
  it("rejects non-object JSON", () => {
    expect(() => parseSettingsJson("[]")).toThrow("settings.json 必须是 JSON 对象");
  });
});
