import { describe, expect, it } from "vitest";

describe("BriefPay wording", () => {
  it("keeps processor wording out of public-facing source", async () => {
    const source = await import("./App?raw").then((module) => module.default as string);
    expect(source).not.toContain("Pay Now");
    expect(source).not.toContain("Payment Successful");
    expect(source).not.toContain("wallet");
  });
});
