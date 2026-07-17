"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Pencil, Trash2, X, Loader2,
  User, Award, Clock, DollarSign, Calendar
} from "lucide-react";

interface Artist {
  id: string;
  name: string;
  specialty: string | null;
  working_hours: string;
  color: string;
  created_at: string;
}

interface Appointment {
  id: string;
  artist_id: string;
  price: number;
  status: string;
  date: string;
  service: string;
  time: string;
}

const EMPTY_FORM = {
  name: "",
  specialty: "",
  working_hours: "10:00 - 20:00",
  color: "#C41E3A",
};

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Artist | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { data: artistsData } = await supabase
      .from("artists")
      .select("*")
      .order("name", { ascending: true });

    // Fetch appointments to calculate stats
    const { data: apptsData } = await supabase
      .from("appointments")
      .select("id, artist_id, price, status, date, service, time");

    if (artistsData) setArtists(artistsData as Artist[]);
    if (apptsData) setAppointments(apptsData as Appointment[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const artistStats = useMemo(() => {
    const stats: Record<string, { totalAppointments: number; completedCount: number; currentMonthRevenue: number }> = {};
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

    // Initialize stats
    artists.forEach(a => {
      stats[a.id] = { totalAppointments: 0, completedCount: 0, currentMonthRevenue: 0 };
    });

    appointments.forEach(appt => {
      if (!appt.artist_id || !stats[appt.artist_id]) return;

      stats[appt.artist_id].totalAppointments += 1;

      if (appt.status === "done") {
        stats[appt.artist_id].completedCount += 1;
      }

      if ((appt.status === "done" || appt.status === "confirmed") && appt.date.startsWith(currentMonth)) {
        stats[appt.artist_id].currentMonthRevenue += Number(appt.price);
      }
    });

    return stats;
  }, [artists, appointments]);

  const handleOpenNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = (a: Artist, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(a);
    setForm({
      name: a.name,
      specialty: a.specialty ?? "",
      working_hours: a.working_hours,
      color: a.color,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      specialty: form.specialty || null,
      working_hours: form.working_hours,
      color: form.color,
    };

    let result;
    if (editing) {
      result = await supabase.from("artists").update(payload).eq("id", editing.id);
      if (selectedArtist?.id === editing.id) {
        setSelectedArtist({ ...selectedArtist, ...payload });
      }
    } else {
      result = await supabase.from("artists").insert(payload);
    }

    setSaving(false);
    if (!result.error) {
      setShowModal(false);
      loadData();
    } else {
      alert("Hata: " + result.error.message);
      console.error(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("artists").delete().eq("id", id);
    if (!error) {
      if (selectedArtist?.id === id) {
        setSelectedArtist(null);
      }
      setDeleteConfirm(null);
      loadData();
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      {/* Topbar */}
      <div className="erp-topbar" style={{ justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>
          Sanatçı Yönetimi
        </span>
        <button className="btn btn-primary" onClick={handleOpenNew}>
          <Plus size={14} /> Yeni Sanatçı
        </button>
      </div>

      <div className="erp-content">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1rem", alignItems: "start" }}>

          {/* Sol: Sanatçı Listesi */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {loading ? (
              <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "center", padding: "3rem" }}>
                <Loader2 size={24} className="animate-spin" style={{ color: "#C41E3A" }} />
              </div>
            ) : artists.length === 0 ? (
              <div className="card" style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                Sanatçı kaydı bulunamadı.
              </div>
            ) : (
              artists.map(a => {
                const aStat = artistStats[a.id] || { totalAppointments: 0, completedCount: 0, currentMonthRevenue: 0 };
                return (
                  <div
                    key={a.id}
                    className="card card-hover"
                    onClick={() => setSelectedArtist(a)}
                    style={{
                      cursor: "pointer",
                      borderLeft: `4px solid ${a.color}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      background: selectedArtist?.id === a.id ? "rgba(196,30,58,0.06)" : "var(--bg-card)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "Cinzel, serif" }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{a.specialty || "Uzmanlık Belirtilmemiş"}</div>
                      </div>
                      <div style={{ display: "flex", gap: "0.25rem" }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={e => handleOpenEdit(a, e)}>
                          <Pencil size={11} />
                        </button>
                        <button className="btn btn-ghost" style={{ padding: "6px 8px", color: "#C41E3A" }} onClick={() => setDeleteConfirm(a.id)}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    <div className="divider" />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <div style={{ fontSize: 12 }}>
                        <div style={{ color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", fontWeight: 600 }}>Ciro (Bu Ay)</div>
                        <div style={{ color: "#4ade80", fontWeight: 700, marginTop: 2 }}>₺{aStat.currentMonthRevenue.toLocaleString("tr-TR")}</div>
                      </div>
                      <div style={{ fontSize: 12 }}>
                        <div style={{ color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", fontWeight: 600 }}>Toplam Seans</div>
                        <div style={{ color: "#fff", fontWeight: 700, marginTop: 2 }}>{aStat.totalAppointments}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sağ: Detay / Takvim / Saat Ayarı */}
          <div>
            {selectedArtist ? (
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: selectedArtist.color }} />
                    <h3 className="font-display text-base font-bold text-white">
                      {selectedArtist.name}
                    </h3>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Profil & Detaylar</div>
                </div>

                <div className="divider" />

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <Award size={14} style={{ color: "#C41E3A" }} />
                    <span style={{ color: "#fff" }}>Uzmanlık: {selectedArtist.specialty || "-"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <Clock size={14} style={{ color: "#C41E3A" }} />
                    <span style={{ color: "#fff" }}>Çalışma Saatleri: {selectedArtist.working_hours}</span>
                  </div>
                </div>

                <div className="divider" />

                <div>
                  <h4 style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                    Finansal Özet
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 8px", background: "rgba(255,255,255,0.01)", borderRadius: 2 }}>
                      <span style={{ color: "var(--text-muted)" }}>Aylık Kazanç Tahmini</span>
                      <span style={{ color: "#4ade80", fontWeight: 700 }}>
                        ₺{(artistStats[selectedArtist.id]?.currentMonthRevenue || 0).toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 8px", background: "rgba(255,255,255,0.01)", borderRadius: 2 }}>
                      <span style={{ color: "var(--text-muted)" }}>Toplam İşlem Sayısı</span>
                      <span style={{ color: "#fff", fontWeight: 700 }}>
                        {artistStats[selectedArtist.id]?.totalAppointments || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="divider" />

                {/* Bugünden Gelecek Randevular */}
                <div>
                  <h4 style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={12} /> Yaklaşan Randevular
                  </h4>
                  {(() => {
                    const upcoming = appointments
                      .filter(appt => appt.artist_id === selectedArtist.id && appt.status !== "done" && appt.status !== "cancelled")
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .slice(0, 3);

                    if (upcoming.length === 0) {
                      return <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>Yaklaşan randevusu yok.</div>;
                    }

                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {upcoming.map(u => (
                          <div key={u.id} style={{ padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 2, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                            <span style={{ color: "#fff", fontWeight: 600 }}>{u.service}</span>
                            <span style={{ color: "var(--text-muted)" }}>{u.date} · {u.time}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                <User size={24} style={{ margin: "0 auto 10px", opacity: 0.25 }} />
                İstatistikleri ve planlama detaylarını görmek için bir sanatçı seçin.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
              <X size={18} />
            </button>

            <div style={{ fontFamily: "Cinzel, serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: "1.5rem" }}>
              {editing ? "Sanatçı Düzenle" : "Yeni Sanatçı Ekle"}
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Ad Soyad</label>
                <input className="input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ad Soyad" required />
              </div>

              <div>
                <label className="label">Uzmanlık Alanları</label>
                <input className="input" value={form.specialty} onChange={e => set("specialty", e.target.value)} placeholder="Örn: Blackwork, Geometrik" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Çalışma Saatleri</label>
                  <input className="input" value={form.working_hours} onChange={e => set("working_hours", e.target.value)} placeholder="10:00 - 20:00" required />
                </div>
                <div>
                  <label className="label">Renk Kodu (Takvim İçin)</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="input" type="color" value={form.color} onChange={e => set("color", e.target.value)} style={{ padding: 0, width: 40, height: 35, cursor: "pointer", border: "none" }} />
                    <input className="input" value={form.color} onChange={e => set("color", e.target.value)} style={{ flex: 1 }} placeholder="#C41E3A" />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? "Kaydediliyor..." : editing ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-panel" style={{ maxWidth: 360, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <Trash2 size={28} style={{ color: "#C41E3A", margin: "0 auto 1rem" }} />
            <div style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              Sanatçıyı Sil
            </div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Seçilen sanatçı kaydı silinecektir. Bu işlem geri alınamaz.
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn btn-primary" style={{ flex: 1, background: "#8B0000", borderColor: "#8B0000" }} onClick={() => handleDelete(deleteConfirm)}>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
