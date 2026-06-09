import { describe, expect, it } from "vitest";
import { getLocale, getMessages } from "../src/i18n";

describe("i18n locale selection", () => {
  it("uses Simplified Chinese only for zh-cn and zh-hans", () => {
    expect(getLocale("zh-cn")).toBe("zh-cn");
    expect(getLocale("zh-hans")).toBe("zh-cn");
    expect(getLocale("zh-tw")).toBe("en");
    expect(getLocale("en")).toBe("en");
    expect(getLocale("ja")).toBe("en");
  });

  it("returns localized messages for the selected locale", () => {
    expect(getMessages("en").apply).toBe("Apply");
    expect(getMessages("zh-cn").apply).toBe("应用");
  });

  it("returns localized usage labels", () => {
    expect(getMessages("en").usageMetricCurrencyTotal).toBe("{currency} total");
    expect(getMessages("zh-cn").usageMetricCurrencyTotal).toBe("{currency} 剩余总余额");
    expect(getMessages("zh-cn").usageMetricApiAvailable).toBe("API 可用");
    expect(getMessages("zh-cn").usageValueYes).toBe("是");
    expect(getMessages("zh-cn").usageLink).toBe("用量链接");
  });
});
