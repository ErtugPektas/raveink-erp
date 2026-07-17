"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Pencil, Trash2, X, Search, Loader2,
  AlertTriangle, Package, CheckCircle2, ChevronUp, ChevronDown
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  min_threshold: number;
  category: string;
  notes: string | null;
  created_at: string;
}

const CATEGORIES = ["mürekkep", "iğne", "hijyen", "takı", "diğer"];

const CATEGORY_LABELS: Record<string, string> = {
  mürekkep: "Mürekkep",
  iğne: "İğne",
  hijyen: "Hijyen & Steril",
  takı: "Piercing & Takı",
  diğer: "Diğer",
};

const CATEGORY_COLORS: Record<string, string> = {
  mürekkep: "text-purple-400 border-purple-400/40 bg-purple-400/10",
  iğne: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  hijyen: "text-sky-400 border-sky-400/40 bg-sky-400/10",
  takı: "text-[#C41E3A] border-[#C41E3A]/40 bg-[#C41E3A]/10",
  diğer: "text-white/40 border-white/10 bg-white/5",
};

const EMPTY_FORM = {
  name: "",
  quantity: "",
  unit: "Adet",
  min_threshold: "5",
  category: "diğer",
  notes: "",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | "all">("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data) {
      setItems(data as InventoryItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const critical = items.filter(i => Number(i.quantity) <= Number(i.min_threshold)).length;
    return { total, critical };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory === "all" || i.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [items, search, filterCategory]);

  const handleOpenNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = (i: InventoryItem) => {
    setEditing(i);
    setForm({
      name: i.name,
      quantity: String(i.quantity),
      unit: i.unit,
      min_threshold: String(i.min_threshold),
      category: i.category,
      notes: i.notes ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      quantity: Number(form.quantity),
      unit: form.unit,
      min_threshold: Number(form.min_threshold),
      category: form.category,
      notes: form.notes || null,
    };

    let result;
    if (editing) {
      result = await supabase.from("inventory").update(payload).eq("id", editing.id);
    } else {
      result = await supabase.from("inventory").insert(payload);
    }

    setSaving(false);
    if (!result.error) {
      setShowModal(false);
      loadData();
    } else {
      alert("Hata: " + result.error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (!error) {
      setDeleteConfirm(null);
      loadData();
    } else {
      alert("Hata: " + error.message);
    }
  };

  // Quick increment/decrement
  const adjustQuantity = async (item: InventoryItem, amount: number) => {
    const newQty = Math.max(0, item.quantity + amount);
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));

    const { error } = await supabase
      .from("inventory")
      .update({ quantity: newQty })
      .eq("id", item.id);

    if (error) {
      alert("Miktar güncellenemedi: " + error.message);
      loadData(); // Revert
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      {/* Topbar */}
      <div className="erp-topbar" style={{ justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>
          Stok &amp; Malzeme Yönetimi
        </span>
        <button className="btn btn-primary" onClick={handleOpenNew}>
          <Plus size={14} /> Yeni Malzeme Ekle
        </button>
      </div>

      <div className="erp-content">
        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="stat-card" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ padding: 10, background: "rgba(255,255,255,0.03)", borderRadius: 2 }}>
              <Package size={20} style={{ color: "#C41E3A" }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "Cinzel, serif" }}>
                {stats.total}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>
                Toplam Malzeme
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ display: "flex", gap: "1rem", alignItems: "center", borderLeft: stats.critical > 0 ? "3px solid #C41E3A" : "" }}>
            <div style={{ padding: 10, background: stats.critical > 0 ? "rgba(196,30,58,0.1)" : "rgba(255,255,255,0.03)", borderRadius: 2 }}>
              {stats.critical > 0 ? (
                <AlertTriangle size={20} style={{ color: "#C41E3A" }} />
              ) : (
                <CheckCircle2 size={20} style={{ color: "#4ade80" }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: stats.critical > 0 ? "#C41E3A" : "#fff", fontFamily: "Cinzel, serif" }}>
                {stats.critical}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>
                Kritik Seviyede
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Malzeme adı ile ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input"
            style={{ width: "auto", cursor: "pointer" }}
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="all">Tüm Kategoriler</option>
            {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#111" }}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>

        {/* Items Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
              <Loader2 size={24} className="animate-spin text-[#C41E3A]" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Kayıtlı malzeme bulunamadı.
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Malzeme Adı</th>
                  <th>Kategori</th>
                  <th style={{ textAlign: "center", width: 140 }}>Miktar</th>
                  <th style={{ textAlign: "center" }}>Eşik Limit</th>
                  <th>Notlar / Açıklama</th>
                  <th style={{ textAlign: "right" }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const isCritical = Number(item.quantity) <= Number(item.min_threshold);
                  return (
                    <tr key={item.id} style={{ opacity: isCritical ? 1 : 0.85 }}>
                      <td>
                        <div style={{ fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                          {item.name}
                          {isCritical && (
                            <span
                              title="Kritik Stok Seviyesi!"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 3,
                                fontSize: 9, fontWeight: 700, color: "#C41E3A",
                                background: "rgba(196,30,58,0.1)", border: "1px solid rgba(196,30,58,0.2)",
                                padding: "2px 6px", borderRadius: 2, letterSpacing: "0.05em", textTransform: "uppercase"
                              }}
                            >
                              <AlertTriangle size={9} /> KRİTİK
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${CATEGORY_COLORS[item.category]}`}>
                          {CATEGORY_LABELS[item.category]}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "4px 6px", minWidth: 24, minHeight: 24 }}
                            onClick={() => adjustQuantity(item, -1)}
                          >
                            -
                          </button>
                          <span style={{ fontSize: 13, fontWeight: 700, color: isCritical ? "#C41E3A" : "#fff", minWidth: 40, display: "inline-block" }}>
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "4px 6px", minWidth: 24, minHeight: 24 }}
                            onClick={() => adjustQuantity(item, 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
                        {item.min_threshold} {item.unit}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.notes || "-"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.25rem", justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={() => handleOpenEdit(item)}>
                            <Pencil size={12} />
                          </button>
                          <button className="btn btn-ghost" style={{ padding: "6px 8px", color: "#C41E3A" }} onClick={() => setDeleteConfirm(item.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
              {editing ? "Malzeme Düzenle" : "Yeni Malzeme Ekle"}
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Malzeme Adı</label>
                <input className="input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Örn: Dynamic Black Dövme Boyası (240ml)" required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Kategori</label>
                  <select className="input" style={{ cursor: "pointer" }} value={form.category} onChange={e => set("category", e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#111" }}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Birim</label>
                  <select className="input" style={{ cursor: "pointer" }} value={form.unit} onChange={e => set("unit", e.target.value)}>
                    {["Adet", "Kutu", "ml", "Paket"].map(u => <option key={u} value={u} style={{ background: "#111" }}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Mevcut Miktar</label>
                  <input className="input" type="number" value={form.quantity} onChange={e => set("quantity", e.target.value)} placeholder="10" required />
                </div>
                <div>
                  <label className="label">Kritik Eşik Limit</label>
                  <input className="input" type="number" value={form.min_threshold} onChange={e => set("min_threshold", e.target.value)} placeholder="5" required />
                </div>
              </div>

              <div>
                <label className="label">Notlar / Açıklama</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Tedarikçi firma, saklama koşulları..." style={{ resize: "vertical" }} />
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
              Malzemeyi Sil
            </div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Bu malzeme kaydı stok envanterinden silinecektir. Bu işlem geri alınamaz.
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
