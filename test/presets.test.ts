import { describe, expect, it } from "vitest";
import { getPreset, migrateBuiltinModels } from "../src/presets";

describe("builtin preset migrations", () => {
  it("declares usage capabilities for built-in providers", () => {
    expect(getPreset("deepseek")?.usage).toEqual({
      kind: "query",
      adapter: "deepseekBalance",
      consoleUrl: "https://platform.deepseek.com/usage"
    });
    expect(getPreset("zhipu")?.usage).toEqual({
      kind: "query",
      adapter: "zhipuCodingPlan",
      experimental: true,
      consoleUrl: "https://bigmodel.cn/coding-plan/personal/usage"
    });
    expect(getPreset("mimo")?.usage).toEqual({
      kind: "externalLink",
      url: "https://platform.xiaomimimo.com/console/plan-manage"
    });
  });

  it("migrates complete legacy model defaults to current defaults", () => {
    expect(
      migrateBuiltinModels("zhipu", {
        opus: "glm-4.7",
        sonnet: "glm-4.7",
        haiku: "glm-4.5-air",
        subagent: "glm-4.5-air"
      })
    ).toEqual({
      opus: "glm-5.1",
      sonnet: "glm-5.1",
      haiku: "glm-5.1",
      subagent: "glm-5.1"
    });

    expect(
      migrateBuiltinModels("mimo", {
        model: "mimo-v2.5",
        opus: "mimo-v2.5",
        sonnet: "mimo-v2.5",
        haiku: "mimo-v2.5",
        subagent: "mimo-v2.5"
      })
    ).toEqual({
      model: "mimo-v2.5-pro[1m]",
      opus: "mimo-v2.5-pro[1m]",
      sonnet: "mimo-v2.5-pro[1m]",
      haiku: "mimo-v2.5-pro[1m]",
      subagent: "mimo-v2.5-pro[1m]"
    });
  });

  it("preserves manually edited model slots that use legacy model names", () => {
    const zhipuModels = {
      opus: "glm-5.1",
      sonnet: "glm-5.1",
      haiku: "glm-4.5-air",
      subagent: "glm-5.1"
    };
    expect(migrateBuiltinModels("zhipu", zhipuModels)).toEqual(zhipuModels);

    const mimoModels = {
      model: "mimo-v2.5-pro[1m]",
      opus: "mimo-v2.5-pro[1m]",
      sonnet: "mimo-v2.5-pro[1m]",
      haiku: "mimo-v2.5",
      subagent: "mimo-v2.5-pro[1m]"
    };
    expect(migrateBuiltinModels("mimo", mimoModels)).toEqual(mimoModels);
  });
});
