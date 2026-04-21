"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSettings, getDbInspector, getAuditExport } from "@/lib/api";
import Link from "next/link";

interface RetentionRow { category: string; retention_period: string; basis: string; auto_delete: boolean }
interface RetentionJob { type: string; schedule: string; last_run: string; next_run: string; records_flagged_last_run: number }
interface DPA { controller: string; processor: string; dpa_reference: string; dpa_date: string; dpa_signed: boolean; basis: string }
interface Encryption { at_rest: string; in_transit: string; sensitive_fields: string; key_management: string }
interface Hosting { demo: string; production_recommended: string; on_premise_available: boolean; data_residency: string }
interface Settings { retention_policy: RetentionRow[]; retention_job: RetentionJob; data_ownership: DPA; encryption: Encryption; hosting: Hosting }
interface DbData { note: string; sample_records: Record<string, string | number | boolean | null>[] }
interface AuditLog { id: number; request_id: number; actor: string; action: string; detail: string; timestamp: string }
interface AuditData { note: string; logs: AuditLog[] }

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dbData, setDbData] = useState<DbData | null>(null);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [tab, setTab] = useState<"retention" | "encryption" | "dpa" | "hosting" | "db" | "logs">("retention");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => router.push("/admin/dashboard"))
      .finally(() => setLoading(false));
  }, [router]);

  async function loadDb() {
    if (!dbData) setDbData(await getDbInspector());
    setTab("db");
  }

  async function loadLogs() {
    if (!auditData) setAuditData(await getAuditExport());
    setTab("logs");
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading…</div>;
  if (!settings) return null;

  const TABS = [
    { id: "retention", label: "Data Retention" },
    { id: "encryption", label: "Encryption" },
    { id: "dpa", label: "Data Ownership (DPA)" },
    { id: "hosting", label: "Hosting Flexibility" },
    { id: "db", label: "DB Inspector" },
    { id: "logs", label: "Pseudonymised Logs" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ background: "#1e293b", color: "#fff", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/admin/dashboard" style={{ color: "#94a3b8", fontSize: 14 }}>← Dashboard</Link>
        <span style={{ fontWeight: 700, fontSize: 17 }}>System Settings</span>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#7c3aed", color: "#fff" }}>Superadmin only</span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => t.id === "db" ? loadDb() : t.id === "logs" ? loadLogs() : setTab(t.id as typeof tab)}
              style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: 500,
                background: tab === t.id ? "#1d4ed8" : "#fff", color: tab === t.id ? "#fff" : "#475569" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "retention" && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Data Retention Policy</h2>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>Configured retention periods per data category, enforced automatically by nightly scheduled job.</p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["Category", "Retention Period", "Legal Basis", "Auto-Delete"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#475569" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {settings.retention_policy.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 500 }}>{r.category}</td>
                      <td style={{ padding: "10px 14px", fontSize: 14 }}>{r.retention_period}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#64748b" }}>{r.basis}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: r.auto_delete ? "#dcfce7" : "#fef9c3", color: r.auto_delete ? "#15803d" : "#854d0e" }}>
                          {r.auto_delete ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card">
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Retention Enforcement Job</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {(Object.entries(settings.retention_job) as [string, string | number][]).map(([k, v]) => (
                  <div key={k} style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{String(v)}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: 12, background: "#eff6ff", borderRadius: 8, fontSize: 13, color: "#1e40af" }}>
                This job runs server-side via APScheduler — not a cron job. It survives container restarts and is logged in the audit trail.
              </div>
            </div>
          </div>
        )}

        {tab === "encryption" && (
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Encryption Configuration</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>How personal data is protected at rest and in transit.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(Object.entries(settings.encryption) as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ padding: 16, background: "#f8fafc", borderRadius: 8, borderLeft: "3px solid #6366f1" }}>
                  <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{k.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "dpa" && (
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Data Ownership — DPA Reference</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>The Data Processing Agreement (DPA) governs the relationship between the university and DataVerse.</p>
            <div style={{ padding: 20, background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0", marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#15803d", fontWeight: 600, marginBottom: 8 }}>DPA SIGNED & ACTIVE</div>
              <div style={{ fontSize: 14, lineHeight: 1.7 }}><strong>{settings.data_ownership.basis}</strong></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["Controller", settings.data_ownership.controller],
                ["Processor", settings.data_ownership.processor],
                ["DPA Reference", settings.data_ownership.dpa_reference],
                ["Date Signed", settings.data_ownership.dpa_date],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "hosting" && (
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Hosting Flexibility</h2>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>DataVerse runs on any hosting environment. The same codebase can move to AWS, on-premise, or any cloud.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <InfoBox label="Current Demo Environment" value={settings.hosting.demo} color="#f59e0b" />
              <InfoBox label="Recommended Production" value={settings.hosting.production_recommended} color="#16a34a" />
              <InfoBox label="On-Premise Available" value={settings.hosting.on_premise_available ? "Yes — Docker/Kubernetes deployment package available" : "No"} color="#6366f1" />
              <InfoBox label="Data Residency Options" value={settings.hosting.data_residency} color="#0ea5e9" />
            </div>
            <div style={{ marginTop: 20, padding: 14, background: "#fef9c3", borderRadius: 8, fontSize: 13, color: "#854d0e" }}>
              <strong>Note:</strong> The university retains the right to migrate to any hosting provider at any time. DataVerse provides a full data export in standard formats upon request.
            </div>
          </div>
        )}

        {tab === "db" && dbData && (
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>DB Inspector — Sample Records</h2>
            <div style={{ padding: 12, background: "#fef3c7", borderRadius: 8, marginBottom: 20, fontSize: 13, color: "#92400e" }}>{dbData.note}</div>
            {dbData.sample_records.map((row, i) => (
              <div key={i} style={{ marginBottom: 16, padding: 16, background: "#f8fafc", borderRadius: 8, fontFamily: "monospace", fontSize: 12 }}>
                {Object.entries(row).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 12, marginBottom: 4 }}>
                    <span style={{ color: "#6366f1", minWidth: 200 }}>{k}</span>
                    <span style={{ color: k.includes("encrypted") ? "#dc2626" : "#1e293b", wordBreak: "break-all" }}>{String(v ?? "null")}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === "logs" && auditData && (
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Pseudonymised Audit Log Export</h2>
            <div style={{ padding: 12, background: "#eff6ff", borderRadius: 8, marginBottom: 20, fontSize: 13, color: "#1e40af" }}>{auditData.note}</div>
            <div style={{ fontFamily: "monospace", fontSize: 12 }}>
              {auditData.logs.slice(0, 20).map((l, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 120px 150px 1fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#94a3b8" }}>{new Date(l.timestamp).toLocaleTimeString()}</span>
                  <span style={{ color: "#6366f1" }}>#{l.request_id}</span>
                  <span style={{ color: "#dc2626" }}>{l.actor.substring(0, 16)}…</span>
                  <span style={{ color: "#374151" }}>{l.action} {l.detail ? `— ${l.detail.substring(0, 60)}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: 16, background: "#f8fafc", borderRadius: 8, borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 12, color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  );
}
