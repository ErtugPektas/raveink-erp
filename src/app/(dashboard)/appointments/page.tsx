"use client";

import { useState, useMemo } from "react";
import { MOCK_APPOINTMENTS, ARTISTS, STATUS_LABELS, type Appointment, type AppointmentStatus, type ServiceType } from "@/lib/data";
import { Plus, Search, Filter, X, Phone, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

type ViewMode = "list" | "week";

const SERVICES: ServiceType[] = ["Dövme", "Piercing", "Dokunmatik", "Kapak", "Lazer"];
const STATUSES: AppointmentStatus[] = ["pending", "confirmed", "done", "cancelled"];

const STATUS_BG: Record<AppointmentStatus, string> = {
  pending: "rgba(250,204,21,0.1)",
  confirmed: "rgba(74,222,128,0.1)",
  done: "rgba(255,255,255,0.04)",
  cancelled: "rgba(196,30,58,0.08)",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "all">("all");
  const [filterArtist, setFilterArtist] = useState("all");
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showModal, setShowModal] = useState(false);
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);

  // Filtered list
  const filtered = useMemo(() => {
    return appointments.filter(a => {
      const matchSearch = a.customerName.toLowerCase().includes(search.toLowerCase()) ||
        a.customerPhone.includes(search) ||
        a.artistName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      const matchArtist = filterArtist === "all" || a.artistId === filterArtist;
      return matchSearch && matchStatus && matchArtist;
    }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [appointments, search, filterStatus, filterArtist]);

  // Week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const updateStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (detailAppt?.id === id) setDetailAppt(prev => prev ? { ...prev, status } : null);
  };

  const waLink = (phone: string, name: string, date: string, time: string) => {
    const msg = encodeURIComponent(`Merhaba ${name}, ${date} tarihli ${time} randevunuzu hatırlatmak istedik. RaveInk Stüdyo 📍`);
    return `https://wa.me/9${phone.replace(/\D/g, "")}?text=${msg}`;
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
        {/* Filters bar */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Müşteri, telefon veya sanatçı ara..."
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
            {ARTISTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          {/* View toggle */}
          <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
            {(["list", "week"] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "7px 14px",
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  background: view === v ? "#C41E3A" : "transparent",
                  color: view === v ? "#fff" : "rgba(255,255,255,0.4)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {v === "list" ? "Liste" : "Haftalık"}
              </button>
            ))}
          </div>
        </div>

        {/* ── LIST VIEW ── */}
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
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.25)", fontFamily: "Montserrat, sans-serif" }}>
                      Randevu bulunamadı
                    </td>
                  </tr>
                ) : (
                  filtered.map(a => (
                    <tr
                      key={a.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setDetailAppt(a)}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: "#fff", fontSize: 12 }}>{a.customerName}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{a.customerPhone}</div>
                      </td>
                      <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{a.artistName}</td>
                      <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{a.service}</td>
                      <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                        {new Date(a.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}
                      </td>
                      <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{a.time}</td>
                      <td style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>₺{a.price.toLocaleString("tr-TR")}</td>
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
                        <a
                          href={waLink(a.customerPhone, a.customerName, new Date(a.date).toLocaleDateString("tr-TR"), a.time)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp Mesajı Gönder"
                          style={{ color: "#4ade80", display: "inline-flex", alignItems: "center" }}
                        >
                          <MessageCircle size={15} />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── WEEK VIEW ── */}
        {view === "week" && (
          <div className="card">
            {/* Week nav */}
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
                const dayAppts = appointments.filter(a => isSameDay(parseISO(a.date), day));
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
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
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
                            borderLeft: `2px solid ${a.status === "confirmed" ? "#4ade80" : a.status === "pending" ? "#facc15" : a.status === "cancelled" ? "#C41E3A" : "rgba(255,255,255,0.2)"}`,
                            cursor: "pointer",
                            fontSize: 10,
                            fontFamily: "Montserrat, sans-serif",
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.time}</div>
                          <div style={{ color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.customerName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── NEW APPOINTMENT MODAL ── */}
      {showModal && <NewAppointmentModal onClose={() => setShowModal(false)} onAdd={a => { setAppointments(prev => [a, ...prev]); setShowModal(false); }} />}

      {/* ── DETAIL MODAL ── */}
      {detailAppt && (
        <div className="modal-overlay" onClick={() => setDetailAppt(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <button onClick={() => setDetailAppt(null)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
              <X size={18} />
            </button>

            <div style={{ fontFamily: "Cinzel, serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>
              {detailAppt.customerName}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              {[
                ["Telefon", detailAppt.customerPhone],
                ["Sanatçı", detailAppt.artistName],
                ["Hizmet", detailAppt.service],
                ["Tarih", new Date(detailAppt.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })],
                ["Saat", detailAppt.time],
                ["Süre", `${detailAppt.duration} dk`],
                ["Ücret", `₺${detailAppt.price.toLocaleString("tr-TR")}`],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 2 }}>
                  <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{k}</div>
                  <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 13, color: "#fff", fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            {detailAppt.notes && (
              <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 2, marginBottom: "1rem" }}>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Notlar</div>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{detailAppt.notes}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <a
                href={waLink(detailAppt.customerPhone, detailAppt.customerName, new Date(detailAppt.date).toLocaleDateString("tr-TR"), detailAppt.time)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ flex: 1, textDecoration: "none" }}
              >
                <MessageCircle size={13} /> WhatsApp
              </a>
              <a
                href={`tel:${detailAppt.customerPhone}`}
                className="btn btn-ghost"
                style={{ flex: 1, textDecoration: "none" }}
              >
                <Phone size={13} /> Ara
              </a>
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

// ── New Appointment Modal ──
function NewAppointmentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (a: Appointment) => void }) {
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    artistId: ARTISTS[0].id,
    service: "Dövme" as ServiceType,
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    duration: 120,
    price: 0,
    notes: "",
  });

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const artist = ARTISTS.find(a => a.id === form.artistId)!;
    onAdd({
      id: `r${Date.now()}`,
      customerId: `c${Date.now()}`,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      artistId: form.artistId,
      artistName: artist.name,
      service: form.service,
      date: form.date,
      time: form.time,
      duration: Number(form.duration),
      price: Number(form.price),
      status: "pending",
      notes: form.notes,
      createdAt: new Date().toISOString().split("T")[0],
    });
  };

  const fields: [string, string, string, string][] = [
    ["customerName", "Müşteri Adı", "text", "Ad Soyad"],
    ["customerPhone", "Telefon", "tel", "0532 000 00 00"],
    ["date", "Tarih", "date", ""],
    ["time", "Saat", "time", ""],
    ["duration", "Süre (dk)", "number", "120"],
    ["price", "Ücret (₺)", "number", "1500"],
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
          <X size={18} />
        </button>
        <div style={{ fontFamily: "Cinzel, serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: "1.5rem" }}>
          Yeni Randevu
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {fields.map(([key, label, type, placeholder]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  className="input"
                  type={type}
                  placeholder={placeholder}
                  value={String((form as Record<string, string | number>)[key])}
                  onChange={e => set(key, e.target.value)}
                  required={["customerName", "customerPhone", "date", "time"].includes(key)}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">Sanatçı</label>
              <select className="input" style={{ cursor: "pointer" }} value={form.artistId} onChange={e => set("artistId", e.target.value)}>
                {ARTISTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Hizmet</label>
              <select className="input" style={{ cursor: "pointer" }} value={form.service} onChange={e => set("service", e.target.value)}>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notlar</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Özel istekler, tasarım detayları..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>İptal</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              <Plus size={13} /> Randevu Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
