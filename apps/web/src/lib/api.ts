const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
let accessToken: string | null = null;
type RefreshSession = { accessToken: string };
let refreshPromise: Promise<RefreshSession> | null = null;

const csrfToken = () => document.cookie.split("; ").find((cookie) => cookie.startsWith("briefpay_csrf="))?.split("=")[1] || "";
export const setAccessToken = (token: string | null) => { accessToken = token; };

const send = (path: string, options: RequestInit) => {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("content-type", "application/json");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  if (["POST", "PATCH", "DELETE"].includes(options.method || "GET")) headers.set("x-csrf-token", csrfToken());
  return fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
};

export async function refreshSession<T extends RefreshSession = RefreshSession>(): Promise<T> {
  if (!refreshPromise) {
    refreshPromise = api<{ data: RefreshSession }>("/auth/refresh", { method: "POST" })
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise as Promise<T>;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response = await send(path, options);
  const canRefresh = !path.startsWith("/auth/") && !path.startsWith("/public/");
  if (response.status === 401 && canRefresh) {
    try {
      await refreshSession();
      response = await send(path, options);
    } catch {
      // Preserve the original private-route error when the session has expired.
    }
  }
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Something went wrong.");
  return payload;
}

export const uploadFile = async (path: string, file: File, purpose: "workspace_logo" | "payment_receipt") => {
  const body = new FormData(); body.append("file", file); body.append("purpose", purpose);
  return api<{ data: { id: string } }>(path, { method: "POST", body });
};
