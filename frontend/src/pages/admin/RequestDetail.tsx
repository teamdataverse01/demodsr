import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getRequestDetail, approveRequest, rejectRequest, getMe } from "../../api";

interface Detail {
  id: number;
  name: string;
  email: string;
  request_type: string;
  status: string;
  risk_tier: string;
  risk_reason: string;
  description: string;
  modification_data: Record<string, string> | null;
  ai_draft: string;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  subject: {
    name: string; email: string; reg_number: string; department: string; role: string;
    special_category: boolean; academic_status: string; has_legal_hold: boolean;
    outstanding_balance?: boolean; is_research_participant?: boolean;
    cgpa?: string; medical_notes?: string; phone?: string; address?: string;
    opt_out_marketing?: boolean; tags?: string; is_deleted?: boolean;
    _visible_fields?: string;
  } | null;
}

interface Me {
  role: string;
  permissions: { can_approve: boolean; can_reject: boolean };
}

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) { navigate("/admin/login"); return; }
    Promise.all([getRequestDetail(Number(id)), getMe()])
      .then(([d, m]) => {
        const r = d.request ?? d;
        const flat = {
          ...r,
          name: r.subject_name ?? r.name,
          email: r.subject_email ?? r.email,
          risk_reason: r.escalation_reason,
          resolved_at: r.completed_at,
          resolution_notes: r.admin_notes,
          subject: d.subject ?? null,
        };
        setDetail(flat); setMe(m); if (flat.ai_draft) setNotes(flat.ai_draft);
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function act(action: "approve" | "reject") {
    setActing(true); setError("");
    try {
      if (action === "approve") await approveRequest(Number(id), notes);
      else await rejectRequest(Number(id), notes);
      navigate("/admin/dashboard");
    } catch (err: unknown) { setError((err as Error).message); }
    finally { setActing(false); }
  }

  if (loading) return <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><p>Loading…</p></main>;
  if (!detail) return <main style={{ padding: 32 }}><p style={{ color: "#dc2626" }}>{error || "Not found"}</p></main>;

  const canAct = me?.permissions.can_approve && detail.status === "escalated";

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/admin/dashboard" style={{ color: "#1d4ed8", fontSize: 14 }}>← Back to Dashboard</Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Request #{detail.id}</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{detail.name} · {detail.email}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className={`badge badge-${detail.risk_tier?.toLowerCase()}`}>{detail.risk_tier}</span>
          <span className={`badge badge-${detail.status}`}>{detail.status.replace(/_/g, " ")}</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Request Details</h2>
        <Row label="Type" value={detail.request_type.replace("_", " ")} />
        <Row label="Submitted" value={new Date(detail.created_at).toLocaleString()} />
        {detail.resolved_at && <Row label="Resolved" value={new Date(detail.resolved_at).toLocaleString()} />}
        {detail.description && <Row label="Description" value={detail.description} />}
        {detail.modification_data && (
          <Row label="Modification Data" value={Object.entries(detail.modification_data).map(([k, v]) => `${k}: ${v}`).join(", ")} />
        )}
      </div>

      {detail.subject && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Subject Profile</h2>
            {detail.subject._visible_fields && (
              <span style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b", padding: "3px 8px", borderRadius: 4 }}>
                Visible to your role: {detail.subject._visible_fields}
              </span>
            )}
          </div>
          <Row label="Name" value={detail.subject.name ?? ""} />
          <Row label="Email" value={detail.subject.email ?? ""} />
          <Row label="Reg Number" value={detail.subject.reg_number ?? "N/A"} />
          <Row label="Department" value={detail.subject.department ?? ""} />
          <Row label="Role" value={detail.subject.role ?? ""} />
          <Row label="Academic Status" value={(detail.subject.academic_status ?? "active").toUpperCase()} />
          {detail.subject.has_legal_hold && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "10px 12px", marginBottom: 12, fontSize: 14, color: "#991b1b" }}>
              ⚠ <strong>Active Legal Hold</strong> — data cannot be modified or deleted until lifted by DPO
            </div>
          )}
          {detail.subject.outstanding_balance && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "10px 12px", marginBottom: 12, fontSize: 14, color: "#92400e" }}>
              ⚠ <strong>Outstanding Financial Obligation</strong> — financial records deletion blocked
            </div>
          )}
          {detail.subject.is_research_participant && <Row label="Research Participant" value="Yes — deletion may affect published datasets" />}
          <Row label="Special Category Data" value={detail.subject.special_category ? "Yes — heightened protection applies" : "No"} />
          {"cgpa" in detail.subject && <Row label="CGPA" value={detail.subject.cgpa ?? "N/A"} />}
          {"medical_notes" in detail.subject && detail.subject.medical_notes && (
            <div style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 6, padding: "10px 12px", marginBottom: 12, fontSize: 14, color: "#6b21a8" }}>
              <strong>Medical Notes (DPO only)</strong><br />{detail.subject.medical_notes}
            </div>
          )}
          {"phone" in detail.subject && <Row label="Phone" value={detail.subject.phone ?? "N/A"} />}
          {"address" in detail.subject && <Row label="Address" value={detail.subject.address ?? "N/A"} />}
          {detail.subject.tags && <Row label="Tags" value={detail.subject.tags} />}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Risk Assessment</h2>
        <p style={{ fontSize: 14, color: "#475569" }}><strong>{detail.risk_tier}</strong>{detail.risk_reason ? ` — ${detail.risk_reason}` : ""}</p>
      </div>

      {canAct && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Resolution</h2>
          {detail.ai_draft && (
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>AI-drafted response pre-loaded below. Edit as needed.</p>
          )}
          <label>Resolution Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} style={{ marginBottom: 16 }} />
          {error && <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 12 }}>{error}</p>}
          <div style={{ display: "flex", gap: 12 }}>
            {me?.permissions.can_approve && (
              <button className="btn btn-success" onClick={() => act("approve")} disabled={acting || !notes.trim()}>
                {acting ? "Processing…" : "Approve & Complete"}
              </button>
            )}
            {me?.permissions.can_reject && (
              <button className="btn btn-danger" onClick={() => act("reject")} disabled={acting || !notes.trim()}>
                {acting ? "Processing…" : "Reject"}
              </button>
            )}
          </div>
        </div>
      )}

      {detail.resolution_notes && !canAct && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Resolution Notes</h2>
          <p style={{ fontSize: 14, color: "#475569", whiteSpace: "pre-wrap" }}>{detail.resolution_notes}</p>
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 14 }}>
      <span style={{ color: "#64748b", minWidth: 160, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#1e293b" }}>{value}</span>
    </div>
  );
}
