const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function post(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Request failed"); }
  return res.json();
}

async function get(path: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Request failed"); }
  return res.json();
}

function tok() { return localStorage.getItem("admin_token") || ""; }

export const submitRequest = (data: unknown) => post("/request/new", data);
export const verifyOtp = (request_id: number, otp: string) => post("/request/verify", { request_id, otp });
export const adminLogin = (email: string, password: string) => post("/admin/login", { email, password });
export const getMe = () => get("/admin/me", tok());
export const getRequests = (status?: string) => get(`/admin/requests${status ? `?status=${status}` : ""}`, tok());
export const getRequestDetail = (id: number) => get(`/admin/requests/${id}`, tok());
export const approveRequest = (id: number, notes: string) => post(`/admin/requests/${id}/approve`, { notes }, tok());
export const rejectRequest = (id: number, notes: string) => post(`/admin/requests/${id}/reject`, { notes }, tok());
export const getSettings = () => get("/admin/settings", tok());
export const getDbInspector = () => get("/admin/db-inspector", tok());
export const getAuditExport = () => get("/admin/audit-export", tok());
