import { describe, expect, it } from "vitest";
import { metadata as privacyMetadata } from "./datenschutz/page";
import { metadata as legalMetadata } from "./impressum/page";
import { metadata as tipsMetadata } from "./tool-tipps/page";

describe("public page canonicals", () => {
  it("gives every public subpage its own canonical URL", () => {
    expect(tipsMetadata.alternates?.canonical).toBe("/tool-tipps");
    expect(legalMetadata.alternates?.canonical).toBe("/impressum");
    expect(privacyMetadata.alternates?.canonical).toBe("/datenschutz");
  });
});