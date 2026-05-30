const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
let accessToken: string | null = null;

const csrfToken = () => document.cookie.split("; ").find((cookie) => cookie.startsWith("briefpay_csrf="))?.split("=")[1] || "";
export const setAccessToken = (token: string | null) => { accessToken = token; };

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("content-type", "application/json");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  if (["POST", "PATCH", "DELETE"].includes(options.method || "GET")) headers.set("x-csrf-token", csrfToken());
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Something went wrong.");
  return payload;
}

export const uploadFile = async (path: string, file: File, purpose: "workspace_logo" | "payment_receipt") => {
  const body = new FormData(); body.append("file", file); body.append("purpose", purpose);
  return api<{ data: { id: string } }>(path, { method: "POST", body });
};
