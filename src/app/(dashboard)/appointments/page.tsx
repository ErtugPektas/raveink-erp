"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, X, Phone, MessageCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

type AppointmentStatus = "pending" | "confirmed" | "done" | "cancelled";
type ServiceType = "Dövme" | "Piercing" | "Dokunmatik" | "Kapak" | "Lazer" | "Fine-line, Botanik" | "Realism, Portrait";

interface DbAppointment {
  id: string;
  customer_id: string;
  artist_id: string;
  service: ServiceType;
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

interface Artist {
  id: string;
  name: string;
  color: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

const SERVICES: ServiceType[] = ["Dövme", "Piercing", "Dokunmatik", "Kapak", "Lazer", "Fine-line, Botanik", "Realism, Portrait"];
const STATUSES: AppointmentStatus[] = ["pending", "confirmed", "done", "cancelled"];

const STATUS_BG: Record<AppointmentStatus, string> = {
  pending: "rgba(250,204,21,0.1)",
  confirmed: "rgba(74,222,128,0.1)",
  done: "rgba(255,255,255,0.04)",
  cancelled: "rgba(196,30,58,0.08)",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  done: "Tamamlandı",
  cancelled: "İptal",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<DbAppointment[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState<"list" | "week">("list");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "all">("all");
  const [filterArtist, setFilterArtist] = useState("all");
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showModal, setShowModal] = useState(false);
  const [detailAppt, setDetailAppt] = useState<DbAppointment | null>(null);

  const loadData = async () => {
    setLoading(true);

    const { data: appts } = await supabase
      .from("appointments")
      .select(`
        id, customer_id, artist_id, service, date, time, duration, price, status, notes,
        customers (name, phone),
        artists (name, color)
      `)
      .order("date", { ascending: true });

    const { data: arts } = await supabase.from("artists").select("id, name, color").order("name");
    const { data: custs } = await supabase.from("customers").select("id, name, phone").order("name");

    if (appts) setAppointments(appts as unknown as DbAppointment[]);
    if (arts) setArtists(arts as Artist[]);
    if (custs) setCustomers(custs as Customer[]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered list
  const filtered = useMemo(() => {
    return appointments.filter(a => {
      const matchSearch =
        (a.customers?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.customers?.phone || "").includes(search) ||
        (a.artists?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      const matchArtist = filterArtist === "all" || a.artist_id === filterArtist;
      return matchSearch && matchStatus && matchArtist;
    });
  }, [appointments, search, filterStatus, filterArtist]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (!error) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      if (detailAppt?.id === id) setDetailAppt(prev => prev ? { ...prev, status } : null);
    }
  };

  const waLink = (phone: string, name: string, date: string, time: string) => {
    const msg = encodeURIComponent(`Merhaba ${name}, ${date} tarihli ${time} randevunuzu hatırlatmak istedik. RaveInk Stüdyo 📍`);
    return `https://wa.me/9${phone.replace(/\D/g, "")}?text=${msg}`;
  };

  const handleAddAppointment = async (form: {
    customer_id: string;
    artist_id: string;
    service: ServiceType;
    date: string;
    time: string;
    duration: number;
    price: number;
    notes: string;
  }) => {
    setSaving(true);
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        customer_id: form.customer_id,
        artist_id: form.artist_id,
        service: form.service,
        date: form.date,
        time: form.time,
        duration: Number(form.duration),
        price: Number(form.price),
        status: "pending",
        notes: form.notes || null,
      })
      .select(`
        id, customer_id, artist_id, service, date, time, duration, price, status, notes,
        customers (name, phone),
        artists (name, color)
      `);

    setSaving(false);
    if (!error && data) {
      setAppointments(prev => [...prev, data[0] as unknown as DbAppointment]);
      setShowModal(false);
    }
  };

  return (
    <>
      {/* Topbar */}
      <div className="erp-topbar" style={{ justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>
          Randevu Yönetimi
        </span>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Yeni Randevu
        </button>
      </div>

      <div className="erp-content">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <Loader2 size={28} className="animate-spin text-[#C41E3A]" />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  className="input"
                  style={{ paddingLeft: 32 }}
                  placeholder="Müşteri veya sanatçı ara..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <select
                className="input"
                style={{ width: "auto", cursor: "pointer" }}
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as AppointmentStatus | "all")}
              >
                <option value="all">Tüm Durumlar</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>

              <select
                className="input"
                style={{ width: "auto", cursor: "pointer" }}
                value={filterArtist}
                onChange={e => setFilterArtist(e.target.value)}
              >
                <option value="all">Tüm Sanatçılar</option>
                {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>

              <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                {(["list", "week"] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    style={{
                      padding: "7px 14px",
                      fontFamily: "Montserrat, sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      background: view === v ? "#C41E3A" : "transparent",
                      color: view === v ? "#fff" : "rgba(255,255,255,0.4)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {v === "list" ? "Liste" : "Haftalık"}
                  </button>
                ))}
              </div>
            </div>

            {/* List View */}
            {view === "list" && (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Müşteri</th>
                      <th>Sanatçı</th>
                      <th>Hizmet</th>
                      <th>Tarih</th>
                      <th>Saat</th>
                      <th>Ücret</th>
                      <th>Durum</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                          Randevu bulunamadı
                        </td>
                      </tr>
                    ) : (
                      filtered.map(a => (
                        <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => setDetailAppt(a)}>
                          <td>
                            <div style={{ fontWeight: 600, color: "#fff", fontSize: 12 }}>{a.customers?.name || "Bilinmeyen Müşteri"}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.customers?.phone || "-"}</div>
                          </td>
                          <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{a.artists?.name || "-"}</td>
                          <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{a.service}</td>
                          <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                            {new Date(a.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}
                          </td>
                          <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{a.time}</td>
                          <td style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>₺{Number(a.price).toLocaleString("tr-TR")}</td>
                          <td>
                            <select
                              className={`badge badge-${a.status}`}
                              style={{ background: STATUS_BG[a.status], cursor: "pointer", border: "none", outline: "none" }}
                              value={a.status}
                              onClick={e => e.stopPropagation()}
                              onChange={e => { e.stopPropagation(); updateStatus(a.id, e.target.value as AppointmentStatus); }}
                            >
                              {STATUSES.map(s => <option key={s} value={s} style={{ background: "#111", color: "#fff" }}>{STATUS_LABELS[s]}</option>)}
                            </select>
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            {a.customers && (
                              <a
                                href={waLink(a.customers.phone, a.customers.name, new Date(a.date).toLocaleDateString("tr-TR"), a.time)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#4ade80", display: "inline-flex", alignItems: "center" }}
                              >
                                <MessageCircle size={15} />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Week View */}
            {view === "week" && (
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => setWeekStart(d => addDays(d, -7))}>
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontFamily: "Cinzel, serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {format(weekStart, "d MMMM", { locale: tr })} – {format(addDays(weekStart, 6), "d MMMM yyyy", { locale: tr })}
                  </span>
                  <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => setWeekStart(d => addDays(d, 7))}>
                    <ChevronRight size={14} />
                  </button>
                  <button className="btn btn-ghost" style={{ fontSize: 10 }} onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                    Bu Hafta
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
                  {weekDays.map(day => {
                    const formattedDay = format(day, "yyyy-MM-dd");
                    const dayAppts = appointments.filter(a => a.date === formattedDay);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div key={day.toISOString()}>
                        <div style={{
                          textAlign: "center",
                          padding: "6px 4px",
                          marginBottom: "0.25rem",
                          borderRadius: 2,
                          background: isToday ? "rgba(196,30,58,0.15)" : "transparent",
                          border: isToday ? "1px solid rgba(196,30,58,0.3)" : "1px solid transparent",
                        }}>
                          <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {format(day, "EEE", { locale: tr })}
                          </div>
                          <div style={{ fontFamily: "Cinzel, serif", fontSize: 18, fontWeight: 700, color: isToday ? "#C41E3A" : "#fff" }}>
                            {format(day, "d")}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {dayAppts.sort((a, b) => a.time.localeCompare(b.time)).map(a => (
                            <div
                              key={a.id}
                              onClick={() => setDetailAppt(a)}
                              style={{
                                padding: "5px 7px",
                                borderRadius: 2,
                                background: STATUS_BG[a.status],
                                borderLeft: `2px solid ${a.artists?.color || "#fff"}`,
                                cursor: "pointer",
                                fontSize: 10,
                              }}
                            >
                              <div style={{ fontWeight: 700, color: "#fff" }}>{a.time}</div>
                              <div style={{ color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {a.customers?.name || "Bilinmeyen"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Appointment Modal */}
      {showModal && (
        <NewAppointmentModal
          customers={customers}
          artists={artists}
          onClose={() => setShowModal(false)}
          onAdd={handleAddAppointment}
          saving={saving}
        />
      )}

      {/* Detail Modal */}
      {detailAppt && (
        <div className="modal-overlay" onClick={() => setDetailAppt(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <button onClick={() => setDetailAppt(null)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
              <X size={18} />
            </button>

            <div style={{ fontFamily: "Cinzel, serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>
              {detailAppt.customers?.name || "Bilinmeyen Müşteri"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              {[
                ["Telefon", detailAppt.customers?.phone || "-"],
                ["Sanatçı", detailAppt.artists?.name || "-"],
                ["Hizmet", detailAppt.service],
                ["Tarih", new Date(detailAppt.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })],
                ["Saat", detailAppt.time],
                ["Süre", `${detailAppt.duration} dk`],
                ["Ücret", `₺${Number(detailAppt.price).toLocaleString("tr-TR")}`],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 2 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            {detailAppt.notes && (
              <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 2, marginBottom: "1rem" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Notlar</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{detailAppt.notes}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              {detailAppt.customers && (
                <a
                  href={waLink(detailAppt.customers.phone, detailAppt.customers.name, new Date(detailAppt.date).toLocaleDateString("tr-TR"), detailAppt.time)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                  style={{ flex: 1, textDecoration: "none" }}
                >
                  <MessageCircle size={13} /> WhatsApp
                </a>
              )}
              {detailAppt.status === "pending" && (
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => updateStatus(detailAppt.id, "confirmed")}>
                  ✓ Onayla
                </button>
              )}
              {detailAppt.status === "confirmed" && (
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => updateStatus(detailAppt.id, "done")}>
                  ✓ Tamamlandı
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NewAppointmentModal({
  customers,
  artists,
  onClose,
  onAdd,
  saving
}: {
  customers: Customer[];
  artists: Artist[];
  onClose: () => void;
  onAdd: (form: {
    customer_id: string;
    artist_id: string;
    service: ServiceType;
    date: string;
    time: string;
    duration: number;
    price: number;
    notes: string;
  }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    customer_id: customers[0]?.id || "",
    artist_id: artists[0]?.id || "",
    service: "Dövme" as ServiceType,
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    duration: 120,
    price: 1500,
    notes: "",
  });

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
          <X size={18} />
        </button>
        <div style={{ fontFamily: "Cinzel, serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: "1.5rem" }}>
          Yeni Randevu Oluştur
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label className="label">Müşteri Seçin</label>
            <select
              className="input"
              style={{ cursor: "pointer" }}
              value={form.customer_id}
              onChange={e => set("customer_id", e.target.value)}
              required
            >
              {customers.map(c => <option key={c.id} value={c.id} style={{ background: "#111" }}>{c.name} ({c.phone})</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">Sanatçı</label>
              <select className="input" style={{ cursor: "pointer" }} value={form.artist_id} onChange={e => set("artist_id", e.target.value)}>
                {artists.map(a => <option key={a.id} value={a.id} style={{ background: "#111" }}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Hizmet</label>
              <select className="input" style={{ cursor: "pointer" }} value={form.service} onChange={e => set("service", e.target.value)}>
                {SERVICES.map(s => <option key={s} value={s} style={{ background: "#111" }}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">Tarih</label>
              <input className="input" type="date" value={form.date} onChange={e => set("date", e.target.value)} required />
            </div>
            <div>
              <label className="label">Saat</label>
              <input className="input" type="time" value={form.time} onChange={e => set("time", e.target.value)} required />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">Süre (Dakika)</label>
              <input className="input" type="number" value={form.duration} onChange={e => set("duration", Number(e.target.value))} required />
            </div>
            <div>
              <label className="label">Ücret (₺)</label>
              <input className="input" type="number" value={form.price} onChange={e => set("price", Number(e.target.value))} required />
            </div>
          </div>

          <div>
            <label className="label">Notlar / Seans Detayları</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Örn: Renkli tasarım, sol omuz çalışması..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>İptal</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving && <Loader2 size={13} className="animate-spin" />}
              Randevu Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
