"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) router.push("/dashboard");
    else setError("E-posta veya şifre hatalı.");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 40%, rgba(196,30,58,0.08) 0%, transparent 65%)",
      }} />

      <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontFamily: "Cinzel, serif", fontSize: 32, fontWeight: 900, letterSpacing: "0.2em", color: "#fff" }}>
            RAVE<span style={{ color: "#C41E3A" }}>INK</span>
          </div>
          <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", marginTop: 6, textTransform: "uppercase" }}>
            Stüdyo Yönetim Paneli
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "#111",
          border: "1px solid rgba(196,30,58,0.25)",
          borderRadius: 2,
          padding: "2rem",
        }}>
          <div style={{ fontFamily: "Cinzel, serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: "1.5rem" }}>
            Giriş Yap
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label">E-posta</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@raveink.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Şifre</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)",
                    display: "flex", alignItems: "center",
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: "8px 12px",
                background: "rgba(196,30,58,0.1)",
                border: "1px solid rgba(196,30,58,0.3)",
                borderRadius: 2,
                color: "#C41E3A",
                fontSize: 12,
                fontFamily: "Montserrat, sans-serif",
              }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: "0.5rem", width: "100%", padding: "10px" }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{
            marginTop: "1.5rem",
            padding: "12px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 2,
            fontSize: 11,
            fontFamily: "Montserrat, sans-serif",
            color: "rgba(255,255,255,0.35)",
          }}>
            <div style={{ marginBottom: 4, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Demo Hesaplar:</div>
            <div>admin@raveink.com / admin123</div>
            <div>mert@raveink.com / mert123</div>
            <div>resepsiyon@raveink.com / rave123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
