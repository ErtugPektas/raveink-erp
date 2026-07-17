"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import {
  Loader2, Menu, X, LayoutDashboard, CalendarDays, Users, Wallet, Package, BarChart3
} from "lucide-react";

const mobileLinks = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Ana Sayfa" },
  { href: "/appointments", icon: CalendarDays,    label: "Randevu" },
  { href: "/customers",    icon: Users,           label: "Müşteri" },
  { href: "/finance",      icon: Wallet,          label: "Finans" },
  { href: "/reports",      icon: BarChart3,       label: "Rapor" },
];

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

      {/* Mobile Bottom Navigation (Native App Style) */}
      <div className="mobile-bottom-nav no-print">
        {mobileLinks.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${active ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

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

        .mobile-bottom-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
          }
          .erp-topbar {
            display: none !important; /* Hide redundant desktop headers */
          }
          .erp-content {
            padding: 1rem 1rem 5rem 1rem; /* Extra padding-bottom for bottom nav */
          }
          .mobile-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: #0c0c0c;
            border-top: 1px solid rgba(255,255,255,0.06);
            justify-content: space-around;
            align-items: center;
            z-index: 40;
            padding-bottom: env(safe-area-inset-bottom); /* iOS home indicator */
          }
          .mobile-bottom-nav .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            color: rgba(255,255,255,0.4);
            text-decoration: none;
            font-size: 10px;
            font-family: 'Montserrat', sans-serif;
            font-weight: 500;
            flex: 1;
            height: 100%;
            transition: all 0.15s;
          }
          .mobile-bottom-nav .nav-item.active {
            color: #C41E3A;
            font-weight: 700;
          }
        }
      `}</style>
    </div>
  );
}
