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
});
