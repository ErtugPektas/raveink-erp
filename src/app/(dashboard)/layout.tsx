"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} style={{ color: "#C41E3A", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="erp-layout">
      <Sidebar />
      <main className="erp-main">
        {children}
      </main>
    </div>
  );
}
