import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMe, getRequests } from "../../api";

interface Request {
  id: number;
  name: string;
  email: string;
  request_type: string;
  status: string;
  risk_tier: string;
  created_at: string;
}

interface Me {
  name: string;
  role: string;
  permissions: { can_approve: boolean; can_reject: boolean; can_export: boolean; sees_all: boolean };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { navigate("/admin/login"); return; }
    Promise.all([getMe(), getRequests()])
      .then(([m, r]) => { setMe(m); setRequests(r); })
      .catch(() => { localStorage.clear(); navigate("/admin/login"); })
      .finally(() => setLoading(false));
  }, [navigate]);

  function logout() { localStorage.clear(); navigate("/admin/login"); }

  const filtered = filter ? requests.filter(r => r.status === filter) : requests;

  if (loading) return <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><p>Loading…</p></main>;

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Covenant University (Demo)</div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>DSR Dashboard</h1>
          {me && <p style={{ color: "#64748b", fontSize: 14, marginTop: 2 }}>Logged in as <strong>{me.name}</strong> · <span style={{ textTransform: "capitalize" }}>{me.role}</span></p>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link to="/admin/settings" className="btn btn-outline" style={{ fontSize: 13, padding: "8px 14px" }}>Settings</Link>
          <Link to="/admin/integration" className="btn btn-outline" style={{ fontSize: 13, padding: "8px 14px" }}>Integration</Link>
          <button className="btn btn-outline" onClick={logout} style={{ fontSize: 13, padding: "8px 14px" }}>Logout</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["", "pending_verification", "verified", "in_progress", "escalated", "completed", "rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="btn btn-outline"
            style={{ fontSize: 12, padding: "6px 12px", background: filter === s ? "#1d4ed8" : "", color: filter === s ? "#fff" : "", borderColor: filter === s ? "#1d4ed8" : "" }}>
            {s === "" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "#64748b", padding: 48 }}>No requests found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(r => (
            <Link to={`/admin/requests/${r.id}`} key={r.id} style={{ textDecoration: "none" }}>
              <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", cursor: "pointer" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{r.email} · {r.request_type.replace("_", " ")}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <span className={`badge badge-${r.risk_tier?.toLowerCase()}`}>{r.risk_tier}</span>
                  <span className={`badge badge-${r.status}`}>{r.status.replace("_", " ")}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>#{r.id}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
