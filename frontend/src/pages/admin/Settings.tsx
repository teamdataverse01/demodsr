import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSettings, getDbInspector, getAuditExport } from "../../api";

interface SettingsResponse {
  retention_policy: { category: string; retention_period: string; basis: string; auto_delete: boolean }[];
  retention_job: { type: string; schedule: string; last_run: string; next_run: string; records_flagged_last_run: number };
  data_ownership: { controller: string; processor: string; dpa_signed: boolean; dpa_date: string; dpa_reference: string; basis: string };
  encryption: { at_rest: string; in_transit: string; sensitive_fields: string; key_management: string };
  hosting: { demo: string; production_recommended: string; on_premise_available: boolean; data_residency: string };
}

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [dbRows, setDbRows] = useState<Record<string, unknown>[] | null>(null);
  const [audit, setAudit] = useState<Record<string, unknown>[] | null>(null);
  const [tab, setTab] = useState<"settings" | "db" | "audit">("settings");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) { navigate("/admin/login"); return; }
    getSettings()
      .then(setSettings)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function loadDb() {
    setTab("db");
    if (dbRows) return;
    try {
      const r = await getDbInspector();
      setDbRows(r.sample_records ?? []);
    } catch (err) { setError((err as Error).message); }
  }

  async function loadAudit() {
    setTab("audit");
    if (audit) return;
    try {
      const r = await getAuditExport();
      setAudit(r.logs ?? []);
    } catch (err) { setError((err as Error).message); }
  }

  if (loading) return <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><p>Loading…</p></main>;

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/admin/dashboard" style={{ color: "#1d4ed8", fontSize: 14 }}>← Back to Dashboard</Link>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Compliance Settings</h1>

      {error && <p style={{ color: "#dc2626", marginBottom: 16 }}>{error}</p>}

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
                  {["Category", "Retention Period", "Legal Basis", "Auto-Delete"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settings.retention_policy.map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{p.category}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{p.retention_period}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{p.basis}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{p.auto_delete ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Automated Retention Job</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
              <KV k="Type" v={settings.retention_job.type} />
              <KV k="Schedule" v={settings.retention_job.schedule} />
              <KV k="Last Run" v={settings.retention_job.last_run} />
              <KV k="Next Run" v={settings.retention_job.next_run} />
              <KV k="Records Flagged (last run)" v={String(settings.retention_job.records_flagged_last_run)} />
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Encryption</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
              <KV k="At Rest" v={settings.encryption.at_rest} />
              <KV k="In Transit" v={settings.encryption.in_transit} />
              <KV k="Sensitive Fields" v={settings.encryption.sensitive_fields} />
              <KV k="Key Management" v={settings.encryption.key_management} />
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Hosting</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
              <KV k="Demo Environment" v={settings.hosting.demo} />
              <KV k="Production Recommended" v={settings.hosting.production_recommended} />
              <KV k="On-Premise Available" v={settings.hosting.on_premise_available ? "Yes" : "No"} />
              <KV k="Data Residency" v={settings.hosting.data_residency} />
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Data Ownership</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
              <KV k="Controller" v={settings.data_ownership.controller} />
              <KV k="Processor" v={settings.data_ownership.processor} />
              <KV k="DPA Signed" v={settings.data_ownership.dpa_signed ? "Yes" : "No"} />
              <KV k="DPA Date" v={settings.data_ownership.dpa_date} />
              <KV k="DPA Reference" v={settings.data_ownership.dpa_reference} />
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{settings.data_ownership.basis}</p>
          </div>
        </div>
      )}

      {tab === "db" && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Database Records (Sample)</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Phone and address fields are stored encrypted at rest as Fernet-encrypted blobs.</p>
          {dbRows === null ? <p>Loading…</p> : dbRows.length === 0 ? <p>No records.</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    {Object.keys(dbRows[0]).map(k => (
                      <th key={k} style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" }}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dbRows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {Object.values(row).map((v, j) => (
                        <td key={j} style={{ padding: "8px 10px", color: "#475569", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(v ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Audit Log Export</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Actor email addresses are SHA-256 pseudonymized for privacy compliance.</p>
          {audit === null ? <p>Loading…</p> : audit.length === 0 ? <p>No audit entries.</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    {Object.keys(audit[0]).map(k => (
                      <th key={k} style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" }}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audit.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {Object.values(row).map((v, j) => (
                        <td key={j} style={{ padding: "8px 10px", color: "#475569", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(v ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
