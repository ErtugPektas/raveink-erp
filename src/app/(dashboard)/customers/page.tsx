"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Pencil, Trash2, X, Search, Loader2,
  User, Phone, Mail, Calendar, StickyNote, Award, Archive
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthdate: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
}

interface Appointment {
  id: string;
  service: string;
  date: string;
  time: string;
  price: number;
  status: string;
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  birthdate: "",
  notes: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerHistory, setCustomerHistory] = useState<Appointment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });
    if (!error && data) {
      setCustomers(data as Customer[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Load appointment history when a customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      const loadHistory = async () => {
        setLoadingHistory(true);
        const { data, error } = await supabase
          .from("appointments")
          .select("id, service, date, time, price, status")
          .eq("customer_id", selectedCustomer.id)
          .order("date", { ascending: false });
        if (!error && data) {
          setCustomerHistory(data as Appointment[]);
        }
        setLoadingHistory(false);
      };
      loadHistory();
    } else {
      setCustomerHistory([]);
    }
  }, [selectedCustomer]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
      const matchTab = activeTab === "active" ? !c.archived : c.archived;
      return matchSearch && matchTab;
    });
  }, [customers, search, activeTab]);

  const stats = useMemo(() => {
    const totalVisits = customerHistory.length;
    const completedVisits = customerHistory.filter(a => a.status === "done");
    const totalSpent = completedVisits.reduce((sum, a) => sum + Number(a.price), 0);
    return { totalVisits, totalSpent };
  }, [customerHistory]);

  const handleOpenNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email ?? "",
      birthdate: c.birthdate ?? "",
      notes: c.notes ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      birthdate: form.birthdate || null,
      notes: form.notes || null,
    };

    let result;
    if (editing) {
      result = await supabase.from("customers").update(payload).eq("id", editing.id);
      if (selectedCustomer?.id === editing.id) {
        setSelectedCustomer({ ...selectedCustomer, ...payload });
      }
    } else {
      result = await supabase.from("customers").insert(payload);
    }

    setSaving(false);
    if (!result.error) {
      setShowModal(false);
      loadCustomers();
    } else {
      alert("Hata: " + result.error.message);
      console.error(result.error);
    }
  };

  const toggleArchive = async (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    const newArchived = !c.archived;

    // Optimistic UI update
    setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, archived: newArchived } : x));
    if (selectedCustomer?.id === c.id) {
      setSelectedCustomer({ ...selectedCustomer, archived: newArchived });
    }

    const { error } = await supabase
      .from("customers")
      .update({ archived: newArchived })
      .eq("id", c.id);

    if (error) {
      alert("Arşivleme hatası: " + error.message);
      loadCustomers();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (!error) {
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
      setDeleteConfirm(null);
      loadCustomers();
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      {/* Topbar */}
      <div className="erp-topbar" style={{ justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>
          Müşteri Yönetimi (CRM)
        </span>
        <button className="btn btn-primary" onClick={handleOpenNew}>
          <Plus size={14} /> Yeni Müşteri
        </button>
      </div>

      <div className="erp-content">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1rem", alignItems: "start" }}>
          
          {/* Sol: Müşteri Listesi */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            
            {/* Tab Selector */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
              {(["active", "archived"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedCustomer(null); }}
                  style={{
                    flex: 1, padding: "12px", border: "none", cursor: "pointer",
                    fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    background: activeTab === tab ? "rgba(196,30,58,0.06)" : "transparent",
                    color: activeTab === tab ? "#C41E3A" : "rgba(255,255,255,0.4)",
                    borderBottom: activeTab === tab ? "2px solid #C41E3A" : "2px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  {tab === "active" ? "Aktif Müşteriler" : "Arşivlenenler (İşlemi Bitenler)"}
                </button>
              ))}
            </div>

            <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  className="input"
                  style={{ paddingLeft: 32 }}
                  placeholder="İsim, telefon veya e-posta ile ara..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                <Loader2 size={24} className="animate-spin" style={{ color: "#C41E3A" }} />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: 12 }}>
                {activeTab === "active" ? "Aktif müşteri bulunamadı." : "Arşivlenmiş müşteri bulunamadı."}
              </div>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Müşteri Bilgileri</th>
                    <th>İletişim</th>
                    <th>Notlar</th>
                    <th style={{ textAlign: "right" }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      style={{
                        cursor: "pointer",
                        background: selectedCustomer?.id === c.id ? "rgba(196,30,58,0.06)" : "transparent"
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: "#fff" }}>{c.name}</div>
                        {c.birthdate && (
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                            🎂 {c.birthdate}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>📞 {c.phone}</span>
                          {c.email && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>✉️ {c.email}</span>}
                        </div>
                      </td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, color: "var(--text-muted)" }}>
                        {c.notes || "-"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.25rem", justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "6px 8px" }}
                            title={c.archived ? "Arşivden Çıkar (Aktif Et)" : "İşlem Bitti / Arşivle"}
                            onClick={e => toggleArchive(c, e)}
                          >
                            <Archive size={12} style={{ color: c.archived ? "#4ade80" : "rgba(255,255,255,0.4)" }} />
                          </button>
                          <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={e => handleOpenEdit(c, e)}>
                            <Pencil size={12} />
                          </button>
                          <button className="btn btn-ghost" style={{ padding: "6px 8px", color: "#C41E3A" }} onClick={() => setDeleteConfirm(c.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Sağ: Müşteri Detay & Geçmiş Panel */}
          <div>
            {selectedCustomer ? (
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <h3 className="font-display text-base font-bold text-white" style={{ marginBottom: 4 }}>
                    {selectedCustomer.name}
                  </h3>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Müşteri Detay Kartı {selectedCustomer.archived && <span style={{ color: "#C41E3A", fontWeight: 700 }}>(ARŞİVLENDİ)</span>}
                  </div>
                </div>

                <div className="divider" />

                {/* İletişim Bilgileri */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <Phone size={14} style={{ color: "#C41E3A" }} />
                    <span style={{ color: "#fff" }}>{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <Mail size={14} style={{ color: "#C41E3A" }} />
                      <span style={{ color: "#fff" }}>{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.birthdate && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <Calendar size={14} style={{ color: "#C41E3A" }} />
                      <span style={{ color: "#fff" }}>Doğum Günü: {selectedCustomer.birthdate}</span>
                    </div>
                  )}
                </div>

                {selectedCustomer.notes && (
                  <div style={{ padding: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                      <StickyNote size={12} /> Özel Notlar / Uyarılar
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
                      {selectedCustomer.notes}
                    </div>
                  </div>
                )}

                <div className="divider" />

                {/* Özet İstatistikler */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div style={{ padding: "10px", background: "#161616", border: "1px solid var(--border)", borderRadius: 2, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "Cinzel, serif" }}>
                      {stats.totalVisits}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>
                      Toplam Randevu
                    </div>
                  </div>
                  <div style={{ padding: "10px", background: "#161616", border: "1px solid var(--border)", borderRadius: 2, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#4ade80", fontFamily: "Cinzel, serif" }}>
                      ₺{stats.totalSpent.toLocaleString("tr-TR")}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>
                      Toplam Harcama
                    </div>
                  </div>
                </div>

                <div className="divider" />

                {/* İşlem Geçmişi */}
                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                    <Award size={13} /> Randevu Geçmişi
                  </h4>

                  {loadingHistory ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
                      <Loader2 size={18} className="animate-spin" style={{ color: "#C41E3A" }} />
                    </div>
                  ) : customerHistory.length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "1rem 0", textAlign: "center" }}>
                      Geçmiş randevu kaydı yok.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                      {customerHistory.map(a => (
                        <div key={a.id} style={{
                          padding: "8px 10px", background: "rgba(255,255,255,0.02)",
                          border: "1px solid var(--border)", borderRadius: 2,
                          display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{a.service}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{a.date} · {a.time}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: a.status === "done" ? "#4ade80" : "var(--text-muted)" }}>
                              ₺{a.price}
                            </div>
                            <div style={{ fontSize: 9, color: a.status === "confirmed" ? "#4ade80" : a.status === "pending" ? "#facc15" : "var(--text-muted)", marginTop: 2 }}>
                              {a.status === "done" ? "Tamamlandı" : a.status === "confirmed" ? "Onaylı" : a.status === "pending" ? "Bekliyor" : "İptal"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                <User size={24} style={{ margin: "0 auto 10px", opacity: 0.25 }} />
                Detayları ve işlem geçmişini görmek için listeden bir müşteri seçin.
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
              {editing ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Ad Soyad</label>
                <input className="input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ad Soyad" required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Telefon</label>
                  <input className="input" type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="0532 000 00 00" required />
                </div>
                <div>
                  <label className="label">Doğum Günü</label>
                  <input className="input" type="text" placeholder="Örn: 14.05.1992" value={form.birthdate} onChange={e => set("birthdate", e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">E-posta</label>
                <input className="input" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="isim@ornek.com" />
              </div>

              <div>
                <label className="label">Notlar (Alerjiler, Tercihler, Özel Bilgiler)</label>
                <textarea className="input" rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Cilt hassasiyetleri, sevdiği modeller vb..." style={{ resize: "vertical" }} />
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
              Müşteriyi Sil
            </div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Müşteri kartı ve tüm geçmiş randevuları silinecektir. Bu işlem geri alınamaz.
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
