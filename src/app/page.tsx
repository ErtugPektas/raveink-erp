"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [user, loading, router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080808" }}>
      <div style={{ fontFamily: "Cinzel, serif", color: "#C41E3A", fontSize: 22, letterSpacing: "0.2em" }}>
        RAVEINK ERP
      </div>
    </div>
  );
}
