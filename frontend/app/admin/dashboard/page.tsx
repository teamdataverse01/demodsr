"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getRequests, getMe } from "@/lib/api";
import Link from "next/link";

type DSRRequest = {
  id: number;
  subject_name: string;
  subject_email: string;
  request_type: string;
  status: string;
  risk_tier: string;
  escalation_reason: string | null;
  created_at: string;
  completed_at: string | null;
};

const RISK_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function AdminDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<DSRRequest[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const adminName = typeof window !== "undefined" ? localStorage.getItem("admin_name") : "";
  const adminRole = typeof window !== "undefined" ? localStorage.getItem("admin_role") : "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getMe();
      setPermissions(me.permissions || {});
      const status = filter === "all" ? undefined : filter;
      const data = await getRequests(status);
      const sorted = [...data].sort((a: DSRRequest, b: DSRRequest) => {
        const ra = RISK_ORDER[a.risk_tier] ?? 99;
        const rb = RISK_ORDER[b.risk_tier] ?? 99;
        return ra !== rb ? ra - rb : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setRequests(sorted);
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => { load(); }, [load]);

  function logout() {
    localStorage.clear();
    router.push("/admin/login");
  }

  const escalated = requests.filter(r => r.status === "escalated").length;
  const critical = requests.filter(r => r.risk_tier === "CRITICAL").length;
  const completed = requests.filter(r => r.status === "completed").length;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "#1e293b", color: "#fff", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 17 }}>DataVerse DSR</span>
          <span style={{ marginLeft: 12, fontSize: 13, color: "#94a3b8" }}>Covenant University (Demo)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 14 }}>
          {permissions.can_view_settings && (
            <Link href="/admin/settings" style={{ color: "#94a3b8", fontSize: 13 }}>Settings</Link>
          )}
          <Link href="/admin/integration" style={{ color: "#94a3b8", fontSize: 13 }}>Integration</Link>
          <span style={{ color: "#94a3b8" }}>{adminName}</span>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: adminRole === "superadmin" ? "#7c3aed" : adminRole === "legal" ? "#0369a1" : "#475569", color: "#fff" }}>
            {adminRole}
          </span>
          <button onClick={logout} style={{ background: "transparent", border: "1px solid #475569", color: "#cbd5e1", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Role notice */}
        {adminRole === "legal" && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 16px", marginBottom: 24, fontSize: 14, color: "#1e40af" }}>
            <strong>Legal role:</strong> You have read-only access to HIGH and CRITICAL risk escalations only. To action a request, contact the DPO.
          </div>
        )}
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Needs Attention", value: escalated, color: "#f59e0b" },
            { label: "Critical Risk", value: critical, color: "#dc2626" },
            { label: "Completed", value: completed, color: "#16a34a" },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["all", "escalated", "completed", "rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: 500,
                background: filter === f ? "#1d4ed8" : "#fff", color: filter === f ? "#fff" : "#475569" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button onClick={load} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 13, color: "#475569" }}>
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading…</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>No requests found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["ID", "Subject", "Type", "Status", "Risk", "Created", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#475569" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontSize: 14 }}>#{r.id}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{r.subject_name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{r.subject_email}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14, textTransform: "capitalize" }}>
                      {r.request_type.replace("_", " ")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className={`badge badge-${r.status}`}>{r.status.replace("_", " ")}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {r.risk_tier && <span className={`badge badge-${r.risk_tier.toLowerCase()}`}>{r.risk_tier}</span>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/admin/requests/${r.id}`} className="btn btn-outline" style={{ padding: "6px 14px", fontSize: 13 }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
