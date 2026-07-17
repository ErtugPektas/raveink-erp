"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCog,
  Wallet,
  Package,
  Megaphone,
  BarChart3,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { href: "/appointments", icon: CalendarDays,    label: "Randevular" },
  { href: "/customers",    icon: Users,           label: "Müşteriler" },
  { href: "/artists",      icon: UserCog,         label: "Sanatçılar" },
  { href: "/finance",      icon: Wallet,          label: "Finans" },
  { href: "/inventory",    icon: Package,         label: "Stok" },
  { href: "/campaigns",    icon: Megaphone,       label: "Kampanyalar" },
  { href: "/reports",      icon: BarChart3,       label: "Raporlar" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="erp-sidebar">
      {/* Logo */}
      <div style={{
        padding: "1.25rem 1.25rem 1rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ fontFamily: "Cinzel, serif", fontSize: 20, fontWeight: 900, letterSpacing: "0.15em", color: "#fff" }}>
          RAVE<span style={{ color: "#C41E3A" }}>INK</span>
        </div>
        <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", marginTop: 3, textTransform: "uppercase" }}>
          ERP Sistemi
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.5rem", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 2,
                fontSize: 12,
                fontFamily: "Montserrat, sans-serif",
                fontWeight: active ? 600 : 400,
                color: active
                  ? "#fff"
                  : "rgba(255,255,255,0.5)",
                background: active ? "rgba(196,30,58,0.12)" : "transparent",
                border: active ? "1px solid rgba(196,30,58,0.25)" : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                textDecoration: "none",
                position: "relative",
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                }
              }}
            >
              <Icon size={15} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={12} style={{ color: "#C41E3A" }} />}
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div style={{
        padding: "0.75rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        {user && (
          <div style={{ marginBottom: "0.5rem", padding: "8px 10px", borderRadius: 2, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, fontWeight: 600, color: "#fff" }}>{user.name}</div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2, textTransform: "capitalize" }}>
              {user.role === "admin" ? "Yönetici" : user.role === "artist" ? "Sanatçı" : "Resepsiyon"}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: "100%", fontSize: 11, gap: 8 }}
        >
          <LogOut size={13} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
