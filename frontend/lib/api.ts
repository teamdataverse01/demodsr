const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function submitRequest(data: {
  name: string;
  email: string;
  request_type: string;
  description: string;
  modification_data?: Record<string, string> | null;
}) {
  const res = await fetch(`${BASE}/request/new`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to submit request.");
  }
  return res.json();
}

export async function verifyOtp(request_id: number, otp: string) {
  const res = await fetch(`${BASE}/request/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request_id, otp }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Verification failed.");
  }
  return res.json();
}

export async function getRequestStatus(id: number) {
  const res = await fetch(`${BASE}/request/${id}/status`);
  if (!res.ok) throw new Error("Request not found.");
  return res.json();
}

// Admin
export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed.");
  }
  return res.json();
}

function authHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function getRequests(status?: string) {
  const url = status ? `${BASE}/admin/requests?status=${status}` : `${BASE}/admin/requests`;
  const res = await fetch(url, { headers: authHeader() });
  if (!res.ok) throw new Error("Failed to load requests.");
  return res.json();
}

export async function getRequestDetail(id: number) {
  const res = await fetch(`${BASE}/admin/requests/${id}`, { headers: authHeader() });
  if (!res.ok) throw new Error("Failed to load request.");
  return res.json();
}

export async function approveRequest(id: number, notes: string) {
  const res = await fetch(`${BASE}/admin/requests/${id}/approve`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to approve.");
  }
  return res.json();
}

export async function rejectRequest(id: number, notes: string) {
  const res = await fetch(`${BASE}/admin/requests/${id}/reject`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to reject.");
  }
  return res.json();
}

export async function getSubjects() {
  const res = await fetch(`${BASE}/admin/subjects`, { headers: authHeader() });
  if (!res.ok) throw new Error("Failed to load subjects.");
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${BASE}/admin/me`, { headers: authHeader() });
  if (!res.ok) throw new Error("Not authenticated.");
  return res.json();
}

export async function getSettings() {
  const res = await fetch(`${BASE}/admin/settings`, { headers: authHeader() });
  if (!res.ok) throw new Error("Access denied.");
  return res.json();
}

export async function getDbInspector() {
  const res = await fetch(`${BASE}/admin/db-inspector`, { headers: authHeader() });
  if (!res.ok) throw new Error("Access denied.");
  return res.json();
}

export async function getAuditExport() {
  const res = await fetch(`${BASE}/admin/audit-export`, { headers: authHeader() });
  if (!res.ok) throw new Error("Access denied.");
  return res.json();
}
