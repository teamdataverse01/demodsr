"use client";
import Link from "next/link";

const CONNECTOR_CODE = `# DataVerse Connector Interface
# 4 functions. Any system can implement this interface to connect.

class DataVerseConnector:

    def get_subject_data(self, email: str) -> dict:
        """
        Retrieve all personal data held on this subject.
        Returns a dict of field -> value.
        Called on: Access requests (auto-executed, LOW risk).
        """
        subject = db.query(Subject).filter_by(email=email).first()
        return {
            "name": subject.name,
            "email": subject.email,
            "department": subject.department,
            "address": subject.address,
            "phone": subject.phone,
            "tags": subject.tags,
        }

    def delete_subject(self, email: str) -> bool:
        """
        Soft-delete the subject record. Returns True on success.
        Called on: Deletion requests (auto-executed, MEDIUM risk).
        Audit entry is written before deletion.
        """
        subject = db.query(Subject).filter_by(email=email).first()
        subject.is_deleted = True
        db.commit()
        return True

    def modify_subject(self, email: str, changes: dict) -> dict:
        """
        Apply field-level updates to the subject record.
        Returns a dict of { field: (old_value, new_value) } for audit log.
        Called on: Modification requests (auto-executed, LOW risk).
        """
        subject = db.query(Subject).filter_by(email=email).first()
        audit_changes = {}
        for field, new_value in changes.items():
            old_value = getattr(subject, field, None)
            setattr(subject, field, new_value)
            audit_changes[field] = (old_value, new_value)
        db.commit()
        return audit_changes

    def stop_processing(self, email: str) -> bool:
        """
        Flag the subject as opted out of all processing / marketing.
        Applies opt_out_marketing=True and stop_processing=True tags.
        Called on: Stop Processing requests (auto-executed, LOW risk).
        """
        subject = db.query(Subject).filter_by(email=email).first()
        subject.opt_out_marketing = True
        subject.stop_processing = True
        subject.tags = ",".join(set(subject.tags.split(",")) | {"opt_out", "stop_marketing"})
        db.commit()
        return True
`;

const TIERS = [
  {
    tier: "Tier 1 — Direct DB Connector",
    description: "DataVerse connects directly to the university's student information system database. Most accurate, real-time. Requires DB credentials and network access.",
    when: "Greenfield deployments or when SIS vendor permits direct DB access.",
    color: "#16a34a",
  },
  {
    tier: "Tier 2 — REST API Connector",
    description: "DataVerse calls the university's existing REST API (e.g., Student Portal API, HR system API). No DB credentials required — only an API key.",
    when: "When the SIS has a modern API layer. Most common for cloud-based SIS vendors.",
    color: "#0ea5e9",
  },
  {
    tier: "Tier 3 — Webhook / Event Connector",
    description: "The university's system pushes events to DataVerse via webhooks. DataVerse maintains a local mirror. Suitable for async or high-volume environments.",
    when: "High-volume universities or when real-time API calls are not permitted.",
    color: "#6366f1",
  },
  {
    tier: "Tier 4 — Manual / CSV Connector",
    description: "For legacy systems with no API. The DPO uploads a CSV export of subject data. DataVerse processes requests against the snapshot and flags stale data.",
    when: "Legacy SIS with no integration capability. Interim solution during modernisation.",
    color: "#f59e0b",
  },
];

export default function IntegrationPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ background: "#1e293b", color: "#fff", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/admin/dashboard" style={{ color: "#94a3b8", fontSize: 14 }}>← Dashboard</Link>
        <span style={{ fontWeight: 700, fontSize: 17 }}>Integration Pattern</span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Connector code */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>The 4-Function Connector Interface</h2>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
            Every integration DataVerse builds implements exactly four functions. Any system — student portal, HR system, alumni database — connects through this clean interface. Nothing more is needed.
          </p>
          <pre style={{
            background: "#0f172a", color: "#e2e8f0", padding: 24, borderRadius: 10,
            fontSize: 12.5, lineHeight: 1.7, overflowX: "auto", fontFamily: "monospace",
          }}>
            {CONNECTOR_CODE}
          </pre>
        </div>

        {/* 4 integration tiers */}
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>4 Integration Tiers</h2>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
            DataVerse works with any university infrastructure — from modern cloud SIS to legacy on-premise systems.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {TIERS.map((t, i) => (
              <div key={i} style={{ padding: 18, background: "#f8fafc", borderRadius: 10, borderLeft: `4px solid ${t.color}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.color, marginBottom: 6 }}>{t.tier}</div>
                <div style={{ fontSize: 14, marginBottom: 6 }}>{t.description}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}><strong>Use when:</strong> {t.when}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: 14, background: "#f0fdf4", borderRadius: 8, fontSize: 13, color: "#15803d" }}>
            <strong>For Covenant University:</strong> Tier 1 (Direct DB Connector) is recommended. The demo is running on Tier 1 right now — all 6 scenarios operate against live data.
          </div>
        </div>
      </div>
    </div>
  );
}
