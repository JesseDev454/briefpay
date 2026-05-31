import { afterEach, describe, expect, it, vi } from "vitest";
import { api, refreshSession, setAccessToken } from "./api";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => {
  setAccessToken(null);
  vi.unstubAllGlobals();
});

describe("api session recovery", () => {
  it("shares one refresh request between concurrent session restores", async () => {
    let completeRefresh: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => {
      completeRefresh = resolve;
    }));
    vi.stubGlobal("document", { cookie: "briefpay_csrf=test-csrf" });
    vi.stubGlobal("fetch", fetchMock);

    const first = refreshSession();
    const second = refreshSession();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    completeRefresh?.(jsonResponse({ data: { accessToken: "restored-token" } }));
    await expect(Promise.all([first, second])).resolves.toEqual([
      { accessToken: "restored-token" },
      { accessToken: "restored-token" },
    ]);
  });

  it("refreshes and retries a private request once after an unauthorized response", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ error: { message: "Please sign in." } }, 401))
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: "renewed-token" } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { items: [{ id: "proposal-1" }] } }));
    vi.stubGlobal("document", { cookie: "briefpay_csrf=test-csrf" });
    vi.stubGlobal("fetch", fetchMock);

    await expect(api("/proposals")).resolves.toEqual({ success: true, data: { items: [{ id: "proposal-1" }] } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(new Headers(fetchMock.mock.calls[2][1]?.headers).get("authorization")).toBe("Bearer renewed-token");
  });
});
