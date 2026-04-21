"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getRequestDetail, approveRequest, rejectRequest } from "@/lib/api";
import Link from "next/link";

type AuditEntry = { id: number; actor: string; action: string; detail: string; timestamp: string };
type SubjectData = Record<string, unknown>;
type RequestData = Record<string, unknown>;

export default function RequestDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ request: RequestData; subject: SubjectData | null; audit_trail: AuditEntry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getRequestDetail(Number(id))
      .then(setData)
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function doApprove() {
    setActionLoading(true);
    try {
      await approveRequest(Number(id), notes);
      setMsg("Request approved and executed.");
      const fresh = await getRequestDetail(Number(id));
      setData(fresh);
    } catch (err: unknown) {
      setMsg((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function doReject() {
    if (!notes.trim()) { setMsg("Please provide a reason for rejection."); return; }
    setActionLoading(true);
    try {
      await rejectRequest(Number(id), notes);
      setMsg("Request rejected.");
      const fresh = await getRequestDetail(Number(id));
      setData(fresh);
    } catch (err: unknown) {
      setMsg((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading…</div>;
  if (!data) return null;

  const { request: req, subject, audit_trail } = data;
  const isEscalated = req.status === "escalated";
  const riskTier = String(req.risk_tier || "");

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ background: "#1e293b", color: "#fff", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/admin/dashboard" style={{ color: "#94a3b8", fontSize: 14 }}>← Dashboard</Link>
        <span style={{ fontWeight: 700, fontSize: 17 }}>Request #{req.id as number}</span>
        <span className={`badge badge-${String(req.status)}`} style={{ marginLeft: 8 }}>{String(req.status).replace("_", " ")}</span>
        {riskTier && <span className={`badge badge-${riskTier.toLowerCase()}`}>{riskTier}</span>}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Request info */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Request Details</h2>
            <Row label="Subject" value={`${req.subject_name} <${req.subject_email}>`} />
            <Row label="Type" value={String(req.request_type).replace("_", " ")} />
            <Row label="Description" value={String(req.description || "—")} />
            <Row label="Submitted" value={new Date(String(req.created_at)).toLocaleString()} />
            {req.completed_at && <Row label="Completed" value={new Date(String(req.completed_at)).toLocaleString()} />}
            {req.escalation_reason && (
              <div style={{ marginTop: 12, padding: 12, background: "#fef3c7", borderRadius: 8, fontSize: 13, borderLeft: "4px solid #f59e0b" }}>
                <strong>Escalation Reason:</strong><br />{String(req.escalation_reason)}
              </div>
            )}
          </div>

          {/* Subject data */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Subject Record</h2>
            {subject ? (
              <>
                <Row label="Name" value={String(subject.name || "—")} />
                <Row label="Email" value={String(subject.email || "—")} />
                <Row label="Phone" value={String(subject.phone || "—")} />
                <Row label="Department" value={String(subject.department || "—")} />
                <Row label="Role" value={String(subject.role || "—")} />
                <Row label="Reg. No." value={String(subject.reg_number || "—")} />
                <Row label="Address" value={String(subject.address || "—")} />
                <Row label="Tags" value={String(subject.tags || "—")} />
                {subject.special_category && (
                  <div style={{ marginTop: 8, padding: "6px 10px", background: "#fee2e2", borderRadius: 6, fontSize: 12, color: "#991b1b", fontWeight: 600 }}>
                    ⚠ Special Category Data (Health)
                  </div>
                )}
                {subject.is_deleted && (
                  <div style={{ marginTop: 8, padding: "6px 10px", background: "#f0fdf4", borderRadius: 6, fontSize: 12, color: "#15803d", fontWeight: 600 }}>
                    ✓ Record Deleted
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: "#64748b", fontSize: 14 }}>Record deleted or not found.</p>
            )}
          </div>
        </div>

        {/* AI Draft */}
        {req.ai_draft && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>AI Draft Response <span style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>(Gemini — for reference only, admin must review)</span></h2>
            <div style={{ marginTop: 12, whiteSpace: "pre-wrap", fontSize: 14, color: "#374151", background: "#f8fafc", padding: 16, borderRadius: 8, borderLeft: "3px solid #6366f1" }}>
              {String(req.ai_draft)}
            </div>
          </div>
        )}

        {/* Actions for escalated */}
        {isEscalated && (
          <div className="card" style={{ marginBottom: 20, borderLeft: "4px solid #f59e0b" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Admin Action Required</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
              This request was escalated by the risk engine. Review the details above, then approve or reject.
            </p>
            <div style={{ marginBottom: 12 }}>
              <label>Notes / Reason</label>
              <textarea value={notes} onChange={e => { setNotes(e.target.value); setMsg(""); }}
                rows={3} placeholder="Add notes for the audit trail and subject notification…" />
            </div>
            {msg && <p style={{ fontSize: 14, color: msg.includes("approved") || msg.includes("rejected") ? "#16a34a" : "#dc2626", marginBottom: 12 }}>{msg}</p>}
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-success" onClick={doApprove} disabled={actionLoading}>
                {actionLoading ? "Processing…" : "Approve & Execute"}
              </button>
              <button className="btn btn-danger" onClick={doReject} disabled={actionLoading}>
                Reject
              </button>
            </div>
          </div>
        )}
        {msg && !isEscalated && (
          <div style={{ marginBottom: 20, padding: 12, background: "#f0fdf4", borderRadius: 8, fontSize: 14, color: "#15803d" }}>{msg}</div>
        )}

        {/* Audit trail */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Audit Trail</h2>
          {audit_trail.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 14 }}>No audit entries yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {audit_trail.map(e => (
                <div key={e.id} style={{ display: "flex", gap: 16, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", minWidth: 140 }}>{new Date(e.timestamp).toLocaleString()}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      <span style={{ color: "#1d4ed8" }}>{e.actor}</span>
                      {" → "}
                      <span style={{ color: "#374151" }}>{e.action.replace("_", " ")}</span>
                    </div>
                    {e.detail && <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{e.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 14 }}>
      <span style={{ color: "#64748b", minWidth: 100, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#1e293b" }}>{value}</span>
    </div>
  );
}
