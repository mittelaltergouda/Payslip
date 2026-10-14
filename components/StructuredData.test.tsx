import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StructuredData } from "./StructuredData";

describe("StructuredData", () => {
  it("carries the request CSP nonce like every other inline script", () => {
    const { container } = render(<StructuredData data={{ name: "SC Payslip" }} nonce="abc123" />);
    const script = container.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;

    expect(script).not.toBeNull();
    expect(script.nonce).toBe("abc123");
  });

  it("escapes < so the JSON cannot close the script element", () => {
    const { container } = render(
      <StructuredData data={{ name: "</script><script>alert(1)</script>" }} nonce="n" />,
    );
    const script = container.querySelector("script") as HTMLScriptElement;

    expect(script.innerHTML).not.toContain("</script>");
    expect(JSON.parse(script.textContent ?? "")).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
