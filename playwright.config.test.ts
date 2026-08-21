import { afterEach, describe, expect, it, vi } from "vitest";

describe("Playwright CI configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("runs the large browser matrix concurrently and streams progress", async () => {
    vi.stubEnv("CI", "true");
    vi.resetModules();

    const { default: config } = await import("./playwright.config");

    expect(config.workers).toBeGreaterThan(1);
    expect(config.reporter).toEqual([
      ["line"],
      ["html", { open: "never" }],
    ]);
  });
});
