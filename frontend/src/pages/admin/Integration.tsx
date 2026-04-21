import { Link } from "react-router-dom";

const ENDPOINTS = [
  { method: "POST", path: "/request/new", auth: false, desc: "Submit a DSR. Returns request_id and triggers OTP email." },
  { method: "POST", path: "/request/verify", auth: false, desc: "Verify OTP. Returns status and risk_tier. Auto-executes LOW/MEDIUM requests." },
  { method: "GET", path: "/request/{id}/status", auth: false, desc: "Check status of any request by ID." },
  { method: "POST", path: "/admin/login", auth: false, desc: "Admin authentication. Returns JWT token." },
  { method: "GET", path: "/admin/me", auth: true, desc: "Current admin profile with role and permissions." },
  { method: "GET", path: "/admin/requests", auth: true, desc: "List all DSRs. Legal role sees HIGH/CRITICAL only. Supports ?status= filter." },
  { method: "GET", path: "/admin/requests/{id}", auth: true, desc: "Full detail for one request including AI draft response." },
  { method: "POST", path: "/admin/requests/{id}/approve", auth: true, desc: "Approve and complete an escalated request. Requires can_approve permission." },
  { method: "POST", path: "/admin/requests/{id}/reject", auth: true, desc: "Reject a request with notes. Requires can_reject permission." },
  { method: "GET", path: "/admin/settings", auth: true, desc: "Retention policies, encryption config, and hosting details." },
  { method: "GET", path: "/admin/db-inspector", auth: true, desc: "Sample records showing encrypted phone/address fields at rest." },
  { method: "GET", path: "/admin/audit-export", auth: true, desc: "Full audit log with SHA-256 pseudonymized actor emails." },
];

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Integration() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/admin/dashboard" style={{ color: "#1d4ed8", fontSize: 14 }}>← Back to Dashboard</Link>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>API Integration</h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>DataVerse exposes a REST API for integration with existing university systems (e.g., Student Portal, CRM, HR).</p>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Base URL</h2>
        <code style={{ background: "#f1f5f9", padding: "10px 14px", borderRadius: 6, display: "block", fontSize: 14, color: "#1e293b", wordBreak: "break-all" }}>
          {BASE_URL}
        </code>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Authentication</h2>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}>Protected endpoints require a Bearer token obtained from <code>/admin/login</code>.</p>
        <code style={{ background: "#f1f5f9", padding: "10px 14px", borderRadius: 6, display: "block", fontSize: 13, color: "#1e293b" }}>
          Authorization: Bearer {"<token>"}
        </code>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Endpoints</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {ENDPOINTS.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: i < ENDPOINTS.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, flexShrink: 0, marginTop: 2,
                background: e.method === "GET" ? "#dbeafe" : "#dcfce7",
                color: e.method === "GET" ? "#1e40af" : "#15803d"
              }}>{e.method}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <code style={{ fontSize: 13, color: "#1e293b" }}>{e.path}</code>
                {e.auth && <span style={{ fontSize: 11, color: "#92400e", background: "#fef3c7", padding: "1px 6px", borderRadius: 4, marginLeft: 8 }}>Auth required</span>}
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Example: Submit a Request</h2>
        <pre style={{ background: "#0f172a", color: "#e2e8f0", padding: 16, borderRadius: 8, fontSize: 12, overflow: "auto", lineHeight: 1.7 }}>{`curl -X POST ${BASE_URL}/request/new \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Ada Okafor",
    "email": "ada@example.com",
    "request_type": "access",
    "description": "Please provide all data held about me."
  }'

# Response:
{
  "request_id": 42,
  "message": "OTP sent to ada@example.com"
}`}</pre>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Risk Tier Logic</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
          <RiskRow tier="CRITICAL" color="#450a0a" bg="#fca5a5" desc="3 or more requests within 7 days — flagged for potential abuse" />
          <RiskRow tier="HIGH" color="#991b1b" bg="#fee2e2" desc="Subject has special category data (medical, biometric, etc.)" />
          <RiskRow tier="MEDIUM" color="#854d0e" bg="#fef9c3" desc="Deletion requests — irreversible action requires review" />
          <RiskRow tier="LOW" color="#15803d" bg="#dcfce7" desc="Standard access, modification, and stop-processing requests" />
        </div>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 16 }}>CRITICAL and HIGH requests are automatically escalated for manual review. LOW and MEDIUM are auto-completed within seconds.</p>
      </div>
    </main>
  );
}

function RiskRow({ tier, color, bg, desc }: { tier: string; color: string; bg: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999, color, background: bg, flexShrink: 0 }}>{tier}</span>
      <span style={{ color: "#475569" }}>{desc}</span>
    </div>
  );
}
