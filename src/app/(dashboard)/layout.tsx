"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { Loader2, Menu, X } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Close sidebar on page change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} style={{ color: "#C41E3A", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`erp-layout ${sidebarOpen ? "sidebar-open" : ""}`}>
      {/* Mobile Top Header (Sticky) */}
      <div className="mobile-header no-print">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div style={{ fontFamily: "Cinzel, serif", fontSize: 14, fontWeight: 900, letterSpacing: "0.1em", color: "#fff" }}>
          RAVE<span style={{ color: "#C41E3A" }}>INK</span>
        </div>
        <div style={{ width: 20 }} /> {/* Spacer */}
      </div>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop no-print"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />
      
      <main className="erp-main">
        {children}
      </main>

      {/* Mobile styling overrides */}
      <style jsx global>{`
        .mobile-header {
          display: none;
          height: 50px;
          background: #0c0c0c;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
          }
          .erp-topbar {
            display: none !important; /* Hide redundant desktop headers */
          }
          .erp-content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
