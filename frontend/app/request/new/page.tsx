"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitRequest, verifyOtp } from "@/lib/api";

const REQUEST_TYPES = [
  { value: "access", label: "Access — What data do you hold about me?" },
  { value: "deletion", label: "Deletion — Remove all my personal data" },
  { value: "modification", label: "Modification — Update my personal data" },
  { value: "stop_processing", label: "Stop Processing — Stop using my data for marketing" },
];

export default function NewRequest() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState<number | null>(null);
  const [result, setResult] = useState<{ status: string; risk_tier: string } | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", request_type: "access", description: "",
    new_address: "", new_phone: "", new_name: "",
  });
  const [otp, setOtp] = useState("");

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const mod = form.request_type === "modification" ? buildModData() : null;
      const res = await submitRequest({
        name: form.name,
        email: form.email,
        request_type: form.request_type,
        description: form.description,
        modification_data: mod,
      });
      setRequestId(res.request_id);
      setStep("otp");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function buildModData(): Record<string, string> | null {
    const d: Record<string, string> = {};
    if (form.new_address.trim()) d.address = form.new_address.trim();
    if (form.new_phone.trim()) d.phone = form.new_phone.trim();
    if (form.new_name.trim()) d.name = form.new_name.trim();
    return Object.keys(d).length ? d : null;
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!requestId) return;
    setLoading(true);
    setError("");
    try {
      const res = await verifyOtp(requestId, otp);
      setResult(res);
      setStep("done");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (step === "done" && result) {
    const isEscalated = result.status === "escalated";
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{isEscalated ? "⏳" : "✅"}</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: isEscalated ? "#92400e" : "#15803d" }}>
              {isEscalated ? "Request Under Review" : "Request Completed"}
            </h1>
            <p style={{ color: "#64748b", marginBottom: 20 }}>
              {isEscalated
                ? "Your request requires additional review by our Data Protection team. You will receive an email once it is processed."
                : "Your request has been processed. A confirmation has been sent to your email."}
            </p>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: 16, marginBottom: 20, fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Request ID</span>
                <strong>#{requestId}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Risk Level</span>
                <span className={`badge badge-${result.risk_tier?.toLowerCase()}`}>{result.risk_tier}</span>
              </div>
            </div>
            <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/")}>
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (step === "otp") {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 400, width: "100%" }}>
          <div className="card">
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Verify Your Identity</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
              A 6-digit code has been sent to <strong>{form.email}</strong>. Enter it below to confirm your request.
            </p>
            <form onSubmit={handleVerify}>
              <div style={{ marginBottom: 20 }}>
                <label>Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => { setOtp(e.target.value); setError(""); }}
                  placeholder="000000"
                  style={{ fontSize: 28, letterSpacing: 12, textAlign: "center" }}
                  autoFocus
                />
              </div>
              {error && <p className="error">{error}</p>}
              <button className="btn btn-primary" type="submit" disabled={loading || otp.length !== 6}
                style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
                {loading ? "Verifying…" : "Verify & Submit"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Covenant University (Demo)</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1e293b" }}>Data Subject Request</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            No account required. We'll verify your identity via your registered email.
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label>Full Name</label>
              <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="As registered with the university" required />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="Your university-registered email" required />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Request Type</label>
              <select value={form.request_type} onChange={e => set("request_type", e.target.value)} required>
                {REQUEST_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {form.request_type === "modification" && (
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Fill in only the fields you want to update:</p>
                <div style={{ marginBottom: 12 }}>
                  <label>New Address</label>
                  <input type="text" value={form.new_address} onChange={e => set("new_address", e.target.value)} placeholder="Leave blank to keep current" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>New Phone Number</label>
                  <input type="text" value={form.new_phone} onChange={e => set("new_phone", e.target.value)} placeholder="Leave blank to keep current" />
                </div>
                <div>
                  <label>New Name</label>
                  <input type="text" value={form.new_name} onChange={e => set("new_name", e.target.value)} placeholder="Leave blank to keep current" />
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label>Additional Details <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                rows={3} placeholder="Any additional context about your request…" />
            </div>

            {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Submitting…" : "Submit Request"}
            </button>
          </form>
        </div>

        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 16, textAlign: "center" }}>
          Your request will be processed in accordance with the NDPR and GDPR within 30 days.
        </p>
      </div>
    </main>
  );
}
