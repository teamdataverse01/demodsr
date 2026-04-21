import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Covenant University (Demo)</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>DataVerse DSR Portal</h1>
        <p style={{ color: "#64748b", fontSize: 16, marginBottom: 40 }}>Exercise your data rights under the Nigeria Data Protection Regulation (NDPR). No account required.</p>
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Submit a Data Request</h2>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>Access, delete, or modify the personal data we hold about you.</p>
          <Link to="/request/new" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Start My Request</Link>
        </div>
        <div style={{ padding: "12px 16px", background: "#f1f5f9", borderRadius: 8, fontSize: 13, color: "#64748b" }}>
          University admin? <Link to="/admin/login" style={{ color: "#1d4ed8", fontWeight: 500 }}>Admin Login →</Link>
        </div>
      </div>
    </main>
  );
}
