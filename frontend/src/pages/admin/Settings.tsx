import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSettings, getDbInspector, getAuditExport } from "../../api";

interface Settings {
  retention_policies: { data_category: string; retention_period: string; legal_basis: string }[];
  retention_job: { schedule: string; last_run: string; next_run: string; records_deleted: number };
  dpa_reference: string;
  encryption: { algorithm: string; key_management: string; at_rest: boolean; in_transit: boolean };
  hosting: { provider: string; region: string; data_residency: string; backup: string };
}

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dbRows, setDbRows] = useState<Record<string, unknown>[] | null>(null);
  const [audit, setAudit] = useState<Record<string, unknown>[] | null>(null);
  const [tab, setTab] = useState<"settings" | "db" | "audit">("settings");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) { navigate("/admin/login"); return; }
    getSettings().then(setSettings).catch(() => navigate("/admin/login")).finally(() => setLoading(false));
  }, [navigate]);

  async function loadDb() {
    if (dbRows) { setTab("db"); return; }
    const r = await getDbInspector(); setDbRows(r); setTab("db");
  }

  async function loadAudit() {
    if (audit) { setTab("audit"); return; }
    const r = await getAuditExport(); setAudit(r); setTab("audit");
  }

  if (loading) return <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><p>Loading…</p></main>;

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/admin/dashboard" style={{ color: "#1d4ed8", fontSize: 14 }}>← Back to Dashboard</Link>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Compliance Settings</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["settings", "db", "audit"] as const).map(t => (
          <button key={t} className="btn btn-outline"
            style={{ fontSize: 13, padding: "8px 14px", background: tab === t ? "#1d4ed8" : "", color: tab === t ? "#fff" : "", borderColor: tab === t ? "#1d4ed8" : "" }}
            onClick={t === "db" ? loadDb : t === "audit" ? loadAudit : () => setTab("settings")}>
            {t === "settings" ? "Retention & Encryption" : t === "db" ? "DB Inspector" : "Audit Export"}
          </button>
        ))}
      </div>

      {tab === "settings" && settings && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Data Retention Policies</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  {["Category", "Retention Period", "Legal Basis"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settings.retention_policies.map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{p.data_category}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{p.retention_period}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{p.legal_basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Automated Retention Job</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
              <KV k="Schedule" v={settings.retention_job.schedule} />
              <KV k="Last Run" v={settings.retention_job.last_run} />
              <KV k="Next Run" v={settings.retention_job.next_run} />
              <KV k="Records Deleted (last run)" v={String(settings.retention_job.records_deleted)} />
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Encryption & Hosting</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
              <KV k="Algorithm" v={settings.encryption.algorithm} />
              <KV k="Key Management" v={settings.encryption.key_management} />
              <KV k="At Rest" v={settings.encryption.at_rest ? "✔ Enabled" : "Disabled"} />
              <KV k="In Transit" v={settings.encryption.in_transit ? "✔ TLS 1.3" : "Disabled"} />
              <KV k="Cloud Provider" v={settings.hosting.provider} />
              <KV k="Region" v={settings.hosting.region} />
              <KV k="Data Residency" v={settings.hosting.data_residency} />
              <KV k="Backup" v={settings.hosting.backup} />
            </div>
          </div>

          <div className="card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: 13, color: "#64748b" }}><strong>DPA Reference:</strong> {settings.dpa_reference}</p>
          </div>
        </div>
      )}

      {tab === "db" && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Database Records (Sample)</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Phone and address fields are stored encrypted at rest.</p>
          {dbRows ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    {Object.keys(dbRows[0] || {}).map(k => (
                      <th key={k} style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" }}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dbRows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {Object.values(row).map((v, j) => (
                        <td key={j} style={{ padding: "8px 10px", color: "#475569", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(v ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p>Loading…</p>}
        </div>
      )}

      {tab === "audit" && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Audit Log Export</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Actor email addresses are SHA-256 pseudonymized for privacy compliance.</p>
          {audit ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    {Object.keys(audit[0] || {}).map(k => (
                      <th key={k} style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" }}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audit.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {Object.values(row).map((v, j) => (
                        <td key={j} style={{ padding: "8px 10px", color: "#475569", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(v ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p>Loading…</p>}
        </div>
      )}
    </main>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 6 }}>
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 2 }}>{k}</div>
      <div style={{ fontWeight: 500 }}>{v}</div>
    </div>
  );
}
