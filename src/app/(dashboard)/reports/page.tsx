"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, BarChart3, TrendingUp, Users, Calendar } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

interface Appointment {
  id: string;
  price: number;
  date: string;
  service: string;
  status: string;
  artist_id: string;
  artists: {
    name: string;
  } | null;
}

const COLORS = ["#C41E3A", "#7c3aed", "#0ea5e9", "#facc15", "#10b981", "#ec4899", "#f97316"];

export default function ReportsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, price, date, service, status, artist_id,
        artists ( name )
      `);
    if (!error && data) {
      setAppointments(data as unknown as Appointment[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Sanatçı Performansı
  const artistPerformance = useMemo(() => {
    const stats: Record<string, { name: string; seans: number; ciro: number }> = {};

    appointments.forEach(a => {
      if (a.status !== "done" && a.status !== "confirmed") return;
      const artistName = a.artists?.name || "Bilinmeyen Sanatçı";

      if (!stats[artistName]) {
        stats[artistName] = { name: artistName, seans: 0, ciro: 0 };
      }
      stats[artistName].seans += 1;
      stats[artistName].ciro += Number(a.price);
    });

    return Object.values(stats);
  }, [appointments]);

  // 2. Randevu Yoğunluğu (Haftanın Günleri)
  const weekdayDensity = useMemo(() => {
    const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
    const stats = days.map(d => ({ name: d, Randevu: 0 }));

    appointments.forEach(a => {
      try {
        const dateObj = new Date(a.date);
        let dayIdx = dateObj.getDay(); // 0 is Sunday
        // Convert to Monday start: Monday is 0, Sunday is 6
        dayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
        if (dayIdx >= 0 && dayIdx < 7) {
          stats[dayIdx].Randevu += 1;
        }
      } catch (e) {
        console.error(e);
      }
    });

    return stats;
  }, [appointments]);

  // 3. Hizmet Kırılımı (Hangi hizmet daha çok tercih ediliyor)
  const serviceDistribution = useMemo(() => {
    const stats: Record<string, number> = {};
    appointments.forEach(a => {
      stats[a.service] = (stats[a.service] || 0) + 1;
    });

    return Object.entries(stats).map(([name, value]) => ({
      name,
      value,
    }));
  }, [appointments]);

  const overview = useMemo(() => {
    const completed = appointments.filter(a => a.status === "done");
    const totalCiro = completed.reduce((s, a) => s + Number(a.price), 0);
    const avgPrice = completed.length > 0 ? Math.round(totalCiro / completed.length) : 0;
    return {
      totalSeans: completed.length,
      totalCiro,
      avgPrice,
    };
  }, [appointments]);

  return (
    <>
      {/* Topbar */}
      <div className="erp-topbar">
        <span style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>
          Analiz &amp; Raporlar
        </span>
      </div>

      <div className="erp-content">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <Loader2 size={28} className="animate-spin text-[#C41E3A]" />
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div style={{ padding: 6, background: "rgba(196,30,58,0.06)", borderRadius: 2 }}><Calendar size={16} style={{ color: "#C41E3A" }} /></div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "Cinzel, serif" }}>
                  {overview.totalSeans}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginTop: 4 }}>
                  Tamamlanan Seans Sayısı
                </div>
              </div>

              <div className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div style={{ padding: 6, background: "rgba(74,222,128,0.06)", borderRadius: 2 }}><TrendingUp size={16} style={{ color: "#4ade80" }} /></div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#4ade80", fontFamily: "Cinzel, serif" }}>
                  ₺{overview.totalCiro.toLocaleString("tr-TR")}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginTop: 4 }}>
                  Toplam Seans Hasılatı
                </div>
              </div>

              <div className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div style={{ padding: 6, background: "rgba(14,165,233,0.06)", borderRadius: 2 }}><BarChart3 size={16} style={{ color: "#0ea5e9" }} /></div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "Cinzel, serif" }}>
                  ₺{overview.avgPrice.toLocaleString("tr-TR")}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginTop: 4 }}>
                  Seans Başı Ortalama Tutar
                </div>
              </div>
            </div>

            {/* Grid 1: Sanatçı Performans & Yoğunluk */}
            <div className="grid-reports-2">
              
              {/* Sanatçı Performansı */}
              <div className="card">
                <h3 className="section-title" style={{ fontSize: 13, marginBottom: "1rem" }}>Sanatçı Hasılat &amp; Performans Dağılımı</h3>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={artistPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                      <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(196,30,58,0.2)", borderRadius: 2 }} labelStyle={{ color: "#fff", fontWeight: 700 }} />
                      <Bar dataKey="ciro" fill="#C41E3A" name="Toplam Ciro (₺)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Günlük Randevu Yoğunluğu */}
              <div className="card">
                <h3 className="section-title" style={{ fontSize: 13, marginBottom: "1rem" }}>Haftalık Randevu Yoğunluk Analizi</h3>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weekdayDensity} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                      <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(196,30,58,0.2)", borderRadius: 2 }} labelStyle={{ color: "#fff", fontWeight: 700 }} />
                      <Line type="monotone" dataKey="Randevu" stroke="#4ade80" strokeWidth={2} dot={{ fill: "#4ade80", r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Grid 2: Hizmet Dağılımı (Dairesel) & Performans Tablosu */}
            <div className="grid-reports-pie">
              
              {/* Hizmet Tercih Oranları */}
              <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <h3 className="section-title" style={{ fontSize: 13, marginBottom: "0.5rem" }}>Hizmet Kırılım Analizi</h3>
                <div style={{ width: "100%", height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {serviceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(196,30,58,0.2)", borderRadius: 2 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, padding: "0 10px 10px" }}>
                  {serviceDistribution.map((s, idx) => (
                    <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[idx % COLORS.length] }} />
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>{s.name}</span>
                      </div>
                      <span style={{ color: "#fff", fontWeight: 700 }}>{s.value} seans</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sanatçı Detay Performans Tablosu */}
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
                  <h3 className="section-title" style={{ fontSize: 13 }}>Sanatçı Özet Raporları</h3>
                </div>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Sanatçı Adı</th>
                      <th style={{ textAlign: "center" }}>Toplam Seans</th>
                      <th style={{ textAlign: "right" }}>Toplam Hasılat</th>
                      <th style={{ textAlign: "right" }}>Seans Başı Ort. Gelir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artistPerformance.map(a => (
                      <tr key={a.name}>
                        <td style={{ fontWeight: 600, color: "#fff" }}>{a.name}</td>
                        <td style={{ textAlign: "center" }}>{a.seans}</td>
                        <td style={{ textAlign: "right", color: "#4ade80", fontWeight: 700 }}>₺{a.ciro.toLocaleString("tr-TR")}</td>
                        <td style={{ textAlign: "right", color: "#0ea5e9", fontWeight: 600 }}>₺{Math.round(a.ciro / a.seans).toLocaleString("tr-TR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </>
        )}
      </div>
    </>
  );
}
