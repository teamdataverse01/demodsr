"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/api";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await adminLogin(email, password);
      localStorage.setItem("admin_token", res.token);
      localStorage.setItem("admin_name", res.name);
      localStorage.setItem("admin_role", res.role);
      localStorage.setItem("admin_email", res.email);
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 400, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Covenant University (Demo)</div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>Admin Login</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>DataVerse DSR Dashboard</p>
        </div>
        <div className="card">
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="dpo@cu-demo.edu.ng" required autoFocus />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label>Password</label>
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••••" required />
            </div>
            {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
        <div style={{ marginTop: 16, padding: "12px 16px", background: "#f1f5f9", borderRadius: 8, fontSize: 13, color: "#64748b" }}>
          <strong>Demo credentials:</strong><br />
          dpo@cu-demo.edu.ng / DPOsecure2024!<br />
          registrar@cu-demo.edu.ng / Registrar2024!<br />
          legal@cu-demo.edu.ng / Legal2024!
        </div>
      </div>
    </main>
  );
}
