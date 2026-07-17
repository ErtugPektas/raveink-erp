"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { CalendarDays, TrendingUp, Users, CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { type AppointmentStatus } from "@/lib/data";

interface DbAppointment {
  id: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: AppointmentStatus;
  notes: string | null;
  customers: {
    name: string;
    phone: string;
  } | null;
  artists: {
    name: string;
    color: string;
  } | null;
}

const STATUS_ICONS: Record<AppointmentStatus, React.ElementType> = {
  pending: Clock,
  confirmed: AlertCircle,
  done: CheckCircle,
  cancelled: XCircle,
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "#facc15",
  confirmed: "#4ade80",
  done: "rgba(255,255,255,0.35)",
  cancelled: "#C41E3A",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  done: "Tamamlandı",
  cancelled: "İptal",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<DbAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [artistsCount, setArtistsCount] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  const loadData = async () => {
    setLoading(true);
    // Fetch appointments
    const { data: appts } = await supabase
      .from("appointments")
      .select(`
        id, service, date, time, duration, price, status, notes,
        customers (name, phone),
        artists (name, color)
      `)
      .order("date", { ascending: false });

    // Fetch artists count
    const { count } = await supabase
      .from("artists")
      .select("*", { count: "exact", head: true });

    if (appts) setAppointments(appts as unknown as DbAppointment[]);
    if (count !== null) setArtistsCount(count);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayAppts = useMemo(
    () => appointments.filter(a => a.date === today),
    [appointments, today]
  );

  const todayRevenue = useMemo(
    () => todayAppts.filter(a => a.status === "done").reduce((s, a) => s + Number(a.price), 0),
    [todayAppts]
  );

  const confirmedToday = todayAppts.filter(a => a.status === "confirmed").length;
  const pendingToday   = todayAppts.filter(a => a.status === "pending").length;

  const recent = useMemo(() => appointments.slice(0, 5), [appointments]);

  return (
    <>
      {/* Topbar */}
      <div className="erp-topbar" style={{ justifyContent: "space-between" }}>
        <div>
          <span style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>
            Dashboard
          </span>
        </div>
        <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Hoş geldin, <span style={{ color: "#fff", fontWeight: 600 }}>{user?.name}</span>
        </div>
      </div>

      <div className="erp-content">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "5rem" }}>
            <Loader2 size={32} className="animate-spin" style={{ color: "#C41E3A" }} />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <StatCard
                icon={<CalendarDays size={20} style={{ color: "#C41E3A" }} />}
                label="Bugünkü Randevular"
                value={String(todayAppts.length)}
                sub={`${confirmedToday} onaylı · ${pendingToday} bekliyor`}
              />
              <StatCard
                icon={<TrendingUp size={20} style={{ color: "#4ade80" }} />}
                label="Günlük Gelir"
                value={`₺${todayRevenue.toLocaleString("tr-TR")}`}
                sub="Tamamlanan seanslar"
                accent="#4ade80"
              />
              <StatCard
                icon={<Users size={20} style={{ color: "#7c3aed" }} />}
                label="Aktif Sanatçılar"
                value={String(artistsCount)}
                sub="Kayıtlı dövme sanatçısı"
                accent="#7c3aed"
              />
              <StatCard
                icon={<CheckCircle size={20} style={{ color: "#facc15" }} />}
                label="Onay Bekliyor"
                value={String(pendingToday)}
                sub="Bugün işlem bekleyen"
                accent="#facc15"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1rem", alignItems: "start" }}>
              {/* Recent appointments */}
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h2 className="section-title" style={{ fontSize: 14 }}>Son Randevular</h2>
                  <a href="/appointments" style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, color: "#C41E3A", textDecoration: "none", fontWeight: 600, letterSpacing: "0.05em" }}>
                    Tümünü Gör →
                  </a>
                </div>

                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Müşteri</th>
                      <th>Sanatçı</th>
                      <th>Hizmet</th>
                      <th>Tarih & Saat</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(a => {
                      const Icon = STATUS_ICONS[a.status];
                      return (
                        <tr key={a.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: "#fff", fontSize: 12 }}>{a.customers?.name || "Bilinmeyen Müşteri"}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.customers?.phone || "-"}</div>
                          </td>
                          <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{a.artists?.name || "-"}</td>
                          <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{a.service}</td>
                          <td>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                              {new Date(a.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.time}</div>
                          </td>
                          <td>
                            <span className={`badge badge-${a.status}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Icon size={10} />
                              {STATUS_LABELS[a.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Today's schedule */}
              <div className="card">
                <h2 className="section-title" style={{ fontSize: 14, marginBottom: "1rem" }}>Bugünün Programı</h2>
                {todayAppts.length === 0 ? (
                  <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0" }}>
                    Bugün randevu yok
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {todayAppts.sort((a, b) => a.time.localeCompare(b.time)).map(a => (
                      <div key={a.id} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: 2,
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}>
                        <div style={{
                          width: 3,
                          height: 36,
                          borderRadius: 2,
                          background: STATUS_COLORS[a.status],
                          flexShrink: 0,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {a.customers?.name || "Bilinmeyen Müşteri"}
                          </div>
                          <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, color: "var(--text-muted)" }}>
                            {a.time} · {a.artists?.name || "-"}
                          </div>
                        </div>
                        <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>
                          ₺{Number(a.price).toLocaleString("tr-TR")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function StatCard({ icon, label, value, sub, accent = "#C41E3A" }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ padding: "6px", background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>{icon}</div>
      </div>
      <div style={{ fontFamily: "Cinzel, serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
        {sub}
      </div>
    </div>
  );
}
