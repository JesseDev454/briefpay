import { describe, expect, it } from "vitest";

describe("token helpers", () => {
  it("generates non-predictable public token values and hashes them", async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/briefpay_test";
    process.env.JWT_ACCESS_SECRET = "test_access_secret_12345678901234567890";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret_1234567890123456789";
    const { createOpaqueToken, hashToken } = await import("./security");
    const first = createOpaqueToken("bp_live");
    const second = createOpaqueToken("bp_live");
    expect(first).not.toBe(second);
    expect(first.startsWith("bp_live_")).toBe(true);
    expect(hashToken(first)).toHaveLength(64);
    expect(hashToken(first)).not.toBe(first);
  });
});
