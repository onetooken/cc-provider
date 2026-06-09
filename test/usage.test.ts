import { describe, expect, it, vi } from "vitest";
import { configFromPreset, getPreset } from "../src/presets";
import { EditableProviderConfig } from "../src/types";
import { fetchProviderUsage, UsageFetch, UsageFetchResponse } from "../src/usage";

describe("provider usage queries", () => {
  it("queries and formats DeepSeek balance", async () => {
    const preset = getPreset("deepseek")!;
    const fetchImpl = vi.fn<UsageFetch>(async () =>
      jsonResponse(200, {
        is_available: true,
        balance_infos: [
          {
            currency: "CNY",
            total_balance: "110.00",
            granted_balance: "10.00",
            topped_up_balance: "100.00"
          }
        ]
      })
    );

    const snapshot = await fetchProviderUsage(configFromPreset(preset), preset, "sk-deepseek", new Date("2026-06-09T00:00:00.000Z"), {
      fetchImpl
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.deepseek.com/user/balance");
    expect(fetchImpl.mock.calls[0][1].headers).toMatchObject({ Authorization: "Bearer sk-deepseek" });
    expect(snapshot).toMatchObject({
      providerId: "deepseek",
      status: "available",
      externalUrl: "https://platform.deepseek.com/usage",
      metrics: [
        { label: "API available", value: "Yes" },
        { label: "CNY total", value: "110.00" },
        { label: "CNY granted", value: "10.00" },
        { label: "CNY topped up", value: "100.00" }
      ]
    });
  });

  it("handles DeepSeek empty balance details", async () => {
    const preset = getPreset("deepseek")!;
    const fetchImpl = vi.fn<UsageFetch>(async () =>
      jsonResponse(200, {
        is_available: false,
        balance_infos: []
      })
    );

    const snapshot = await fetchProviderUsage(configFromPreset(preset), preset, "sk-deepseek", new Date("2026-06-09T00:00:00.000Z"), {
      fetchImpl
    });

    expect(snapshot.status).toBe("available");
    expect(snapshot.metrics).toEqual([{ label: "API available", value: "No" }]);
    expect(snapshot.message).toBe("No balance entries returned.");
  });

  it("returns an error snapshot for provider HTTP failures", async () => {
    const preset = getPreset("deepseek")!;
    const fetchImpl = vi.fn<UsageFetch>(async () => jsonResponse(401, { error: "unauthorized" }));

    const snapshot = await fetchProviderUsage(configFromPreset(preset), preset, "bad-token", new Date("2026-06-09T00:00:00.000Z"), {
      fetchImpl
    });

    expect(snapshot.status).toBe("error");
    expect(snapshot.message).toContain("HTTP 401");
    expect(snapshot.message).toContain("unauthorized");
  });

  it("queries Zhipu usage endpoints with the official plugin headers and 24-hour window", async () => {
    const preset = getPreset("zhipu")!;
    const fetchImpl = vi.fn<UsageFetch>(async (url) => {
      if (url.includes("/model-usage")) {
        return jsonResponse(200, { data: { models: [{ name: "glm-5.1" }] } });
      }
      if (url.includes("/tool-usage")) {
        return jsonResponse(200, { data: { tools: [{ name: "mcp" }] } });
      }
      return jsonResponse(200, {
        data: {
          limits: [
            { type: "TOKENS_LIMIT", percentage: 12 },
            { type: "TIME_LIMIT", percentage: "30", currentValue: 3, usage: 10, usageDetails: [{ tool: "x" }] }
          ]
        }
      });
    });

    const snapshot = await fetchProviderUsage(configFromPreset(preset), preset, "zhipu-token", new Date(2026, 0, 2, 15, 30, 20), {
      fetchImpl
    });

    const query = "?startTime=2026-01-01%2015%3A00%3A00&endTime=2026-01-02%2015%3A59%3A59";
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      `https://open.bigmodel.cn/api/monitor/usage/model-usage${query}`,
      `https://open.bigmodel.cn/api/monitor/usage/tool-usage${query}`,
      "https://open.bigmodel.cn/api/monitor/usage/quota/limit"
    ]);
    for (const [, init] of fetchImpl.mock.calls) {
      expect(init.headers).toMatchObject({
        Authorization: "zhipu-token",
        "Accept-Language": "en-US,en",
        "Content-Type": "application/json"
      });
    }
    expect(snapshot).toMatchObject({
      providerId: "zhipu",
      status: "available",
      experimental: true,
      externalUrl: "https://bigmodel.cn/coding-plan/personal/usage",
      metrics: [
        { label: "Token usage (5h)", value: "12%" },
        { label: "MCP usage (1 month)", value: "30%", detail: "current: 3, limit: 10" }
      ]
    });
    expect(snapshot.details).toBeUndefined();
  });

  it("rejects unsupported Zhipu usage origins without sending requests", async () => {
    const preset = getPreset("zhipu")!;
    const config = { ...configFromPreset(preset), baseUrl: "https://example.com/api/anthropic" };
    const fetchImpl = vi.fn<UsageFetch>(async () => jsonResponse(200, {}));

    const snapshot = await fetchProviderUsage(config, preset, "zhipu-token", new Date("2026-06-09T00:00:00.000Z"), {
      fetchImpl
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(snapshot.status).toBe("error");
    expect(snapshot.message).toContain("Unsupported Zhipu usage host");
  });

  it("returns external-link and unsupported snapshots without network requests", async () => {
    const mimoPreset = getPreset("mimo")!;
    const fetchImpl = vi.fn<UsageFetch>(async () => jsonResponse(200, {}));
    const mimo = await fetchProviderUsage(configFromPreset(mimoPreset), mimoPreset, undefined, new Date("2026-06-09T00:00:00.000Z"), {
      fetchImpl
    });
    const customConfig: EditableProviderConfig = {
      providerId: "custom",
      displayName: "Custom",
      baseUrl: "https://example.com/anthropic",
      models: {},
      customEnv: {},
      maxEffort: false,
      disableClaudeAttribution: true,
      disableNonessentialTraffic: true,
      permissionDefaultMode: "none",
      enableAutoTheme: true
    };
    const custom = await fetchProviderUsage(customConfig, undefined, undefined, new Date("2026-06-09T00:00:00.000Z"), {
      fetchImpl
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(mimo).toMatchObject({
      providerId: "mimo",
      status: "externalLink",
      externalUrl: "https://platform.xiaomimimo.com/console/plan-manage"
    });
    expect(custom).toMatchObject({ providerId: "custom", status: "unsupported" });
  });

  it("uses custom provider external usage links without network requests", async () => {
    const fetchImpl = vi.fn<UsageFetch>(async () => jsonResponse(200, {}));
    const config = customConfig({
      usage: { kind: "externalLink", url: "https://example.com/usage" }
    });

    const snapshot = await fetchProviderUsage(config, undefined, undefined, new Date("2026-06-09T00:00:00.000Z"), {
      fetchImpl
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(snapshot).toMatchObject({
      providerId: "custom",
      status: "externalLink",
      externalUrl: "https://example.com/usage"
    });
  });

  it("does not expose invalid custom provider usage links", async () => {
    const fetchImpl = vi.fn<UsageFetch>(async () => jsonResponse(200, {}));
    const config = customConfig({
      usage: { kind: "externalLink", url: "vscode://example" }
    });

    const snapshot = await fetchProviderUsage(config, undefined, undefined, new Date("2026-06-09T00:00:00.000Z"), {
      fetchImpl
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(snapshot).toMatchObject({ providerId: "custom", status: "unsupported" });
    expect(snapshot.externalUrl).toBeUndefined();
  });

  it("prefers built-in preset usage over config usage", async () => {
    const preset = getPreset("mimo")!;
    const fetchImpl = vi.fn<UsageFetch>(async () => jsonResponse(200, {}));
    const config = {
      ...configFromPreset(preset),
      usage: { kind: "externalLink" as const, url: "https://example.com/usage" }
    };

    const snapshot = await fetchProviderUsage(config, preset, undefined, new Date("2026-06-09T00:00:00.000Z"), {
      fetchImpl
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(snapshot.externalUrl).toBe("https://platform.xiaomimimo.com/console/plan-manage");
  });

  it("returns missingToken for query providers without network requests", async () => {
    const preset = getPreset("deepseek")!;
    const fetchImpl = vi.fn<UsageFetch>(async () => jsonResponse(200, {}));

    const snapshot = await fetchProviderUsage(configFromPreset(preset), preset, undefined, new Date("2026-06-09T00:00:00.000Z"), {
      fetchImpl
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(snapshot.status).toBe("missingToken");
    expect(snapshot.externalUrl).toBe("https://platform.deepseek.com/usage");
  });
});

function jsonResponse(status: number, value: unknown): UsageFetchResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof value === "string" ? value : JSON.stringify(value))
  };
}

function customConfig(overrides: Partial<EditableProviderConfig> = {}): EditableProviderConfig {
  return {
    providerId: "custom",
    displayName: "Custom",
    baseUrl: "https://example.com/anthropic",
    models: {},
    customEnv: {},
    maxEffort: false,
    disableClaudeAttribution: true,
    disableNonessentialTraffic: true,
    permissionDefaultMode: "none",
    enableAutoTheme: true,
    ...overrides
  };
}
