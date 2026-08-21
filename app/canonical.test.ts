import { describe, expect, it } from "vitest";
import { metadata as privacyMetadata } from "./datenschutz/page";
import { metadata as legalMetadata } from "./impressum/page";
import { metadata as tipsMetadata } from "./tool-tipps/page";
import { rootMetadata } from "@/lib/seo";

describe("public page canonicals", () => {
  it("gives every public subpage its own canonical URL", () => {
    expect(tipsMetadata.alternates?.canonical).toBe("/tool-tipps");
    expect(legalMetadata.alternates?.canonical).toBe("/impressum");
    expect(privacyMetadata.alternates?.canonical).toBe("/datenschutz");
  });

  it("lets the parent template add the brand exactly once", () => {
    expect(rootMetadata.title).toMatchObject({ template: "%s | SC Payslip" });
    expect(tipsMetadata.title).toBe("Tool-Tipps");
    expect(legalMetadata.title).toBe("Impressum");
    expect(privacyMetadata.title).toBe("Datenschutz");
  });
});