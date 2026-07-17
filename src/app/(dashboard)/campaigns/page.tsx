"use client";

import { useState, useEffect } from "react";
import { supabase, type Campaign, type CampaignType } from "@/lib/supabase";
import {
  Plus, Pencil, Trash2, X, Eye, EyeOff, Loader2,
  Tag, Megaphone, Clock, ExternalLink, GripVertical
} from "lucide-react";

const TYPE_OPTS: { value: CampaignType; label: string; icon: React.ElementType; color: string }[] = [
  { value: "kampanya", label: "Kampanya", icon: Tag,      color: "#C41E3A" },
  { value: "duyuru",   label: "Duyuru",   icon: Megaphone, color: "#facc15" },
  { value: "etkinlik", label: "Etkinlik", icon: Clock,    color: "#38bdf8" },
];

const EMPTY_FORM = {
  type: "kampanya" as CampaignType,
  badge: "Kampanya",
  title: "",
  summary: "",
  detail: "",
  expiry: "",
  active: true,
  sort_order: 0,
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns]     = useState<Campaign[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState<Campaign | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setCampaigns(data as Campaign[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      type:       c.type,
      badge:      c.badge,
      title:      c.title,
      summary:    c.summary,
      detail:     c.detail,
      expiry:     c.expiry ?? "",
      active:     c.active,
      sort_order: c.sort_order,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      expiry: form.expiry || null,
      sort_order: Number(form.sort_order),
    };

    if (editing) {
      await supabase.from("campaigns").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("campaigns").insert(payload);
    }

    setSaving(false);
    setShowModal(false);
    load();
  };

  const toggleActive = async (c: Campaign) => {
    await supabase.from("campaigns").update({ active: !c.active }).eq("id", c.id);
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, active: !x.active } : x));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("campaigns").delete().eq("id", id);
    setCampaigns(prev => prev.filter(x => x.id !== id));
    setDeleteConfirm(null);
  };

  const set = (k: string, v: string | boolean | number) =>
    setForm(f => ({ ...f, [k]: v }));

  const typeColor: Record<CampaignType, string> = {
    kampanya: "#C41E3A",
    duyuru:   "#facc15",
    etkinlik: "#38bdf8",
  };

  return (
    <>
      {/* Topbar */}
      <div className="erp-topbar" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>
            Kampanya Yönetimi
          </span>
          <a
            href="https://raveink-app.vercel.app/#announcements"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontFamily: "Montserrat, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.35)",
              textDecoration: "none", transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#C41E3A")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <ExternalLink size={11} /> Siteyi Görüntüle
          </a>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={14} /> Yeni Kampanya
        </button>
      </div>

      <div className="erp-content">
        {/* Info banner */}
        <div style={{
          padding: "10px 14px", marginBottom: "1rem",
          background: "rgba(196,30,58,0.06)", border: "1px solid rgba(196,30,58,0.2)",
          borderRadius: 2, display: "flex", alignItems: "center", gap: 8,
          fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)",
        }}>
          <span style={{ color: "#C41E3A", fontWeight: 700 }}>●</span>
          Burada eklediğiniz kampanyalar <strong style={{ color: "#fff" }}>anında</strong> raveink-app.vercel.app sitesinde görünür.
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <Loader2 size={24} style={{ color: "#C41E3A", animation: "spin 1s linear infinite" }} />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <Megaphone size={32} style={{ color: "rgba(255,255,255,0.15)", margin: "0 auto 1rem" }} />
            <div style={{ fontFamily: "Cinzel, serif", fontSize: 14, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
              Henüz kampanya yok
            </div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.2)", marginBottom: "1.5rem" }}>
              İlk kampanyanızı ekleyerek siteye yansıtın.
            </div>
            <button className="btn btn-primary" onClick={openNew}><Plus size={13} /> Kampanya Ekle</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {campaigns.map(c => {
              const TypeIcon = TYPE_OPTS.find(t => t.value === c.type)?.icon ?? Tag;
              return (
                <div
                  key={c.id}
                  className="card card-hover"
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem",
                    opacity: c.active ? 1 : 0.45,
                    borderLeft: `3px solid ${c.active ? typeColor[c.type] : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  <GripVertical size={14} style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }} />

                  <div style={{
                    width: 32, height: 32, borderRadius: 2, flexShrink: 0,
                    background: `${typeColor[c.type]}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <TypeIcon size={14} style={{ color: typeColor[c.type] }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: "Cinzel, serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                        {c.title}
                      </span>
                      <span style={{
                        fontFamily: "Montserrat, sans-serif", fontSize: 9, fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        color: typeColor[c.type], padding: "1px 7px",
                        border: `1px solid ${typeColor[c.type]}40`, borderRadius: 999,
                        background: `${typeColor[c.type]}10`,
                      }}>
                        {c.badge}
                      </span>
                      {!c.active && (
                        <span style={{
                          fontFamily: "Montserrat, sans-serif", fontSize: 9, fontWeight: 700,
                          letterSpacing: "0.1em", textTransform: "uppercase",
                          color: "rgba(255,255,255,0.3)", padding: "1px 7px",
                          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999,
                        }}>
                          GİZLİ
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.summary}
                    </div>
                  </div>

                  {c.expiry && (
                    <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>
                      {c.expiry}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "6px 8px" }}
                      title={c.active ? "Gizle" : "Yayınla"}
                      onClick={() => toggleActive(c)}
                    >
                      {c.active ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "6px 8px" }}
                      title="Düzenle"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "6px 8px", color: "#C41E3A" }}
                      title="Sil"
                      onClick={() => setDeleteConfirm(c.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
              <X size={18} />
            </button>

            <div style={{ fontFamily: "Cinzel, serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: "1.5rem" }}>
              {editing ? "Kampanya Düzenle" : "Yeni Kampanya"}
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Type */}
              <div>
                <label className="label">Tür</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {TYPE_OPTS.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => { set("type", t.value); set("badge", t.label); }}
                      style={{
                        flex: 1, padding: "8px 4px", borderRadius: 2, cursor: "pointer",
                        fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        background: form.type === t.value ? `${t.color}18` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${form.type === t.value ? t.color + "50" : "rgba(255,255,255,0.08)"}`,
                        color: form.type === t.value ? t.color : "rgba(255,255,255,0.4)",
                        transition: "all 0.15s",
                      }}
                    >
                      <t.icon size={14} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Başlık</label>
                  <input className="input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Kampanya başlığı" required />
                </div>
                <div>
                  <label className="label">Rozet Metni</label>
                  <input className="input" value={form.badge} onChange={e => set("badge", e.target.value)} placeholder="Kampanya" />
                </div>
              </div>

              <div>
                <label className="label">Kısa Açıklama (Kart üzerinde görünür)</label>
                <input className="input" value={form.summary} onChange={e => set("summary", e.target.value)} placeholder="Kısa özet..." required />
              </div>

              <div>
                <label className="label">Detaylı Açıklama (Modal'da görünür)</label>
                <textarea className="input" rows={3} value={form.detail} onChange={e => set("detail", e.target.value)} placeholder="Kampanya detayları, şartları..." required style={{ resize: "vertical" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Son Geçerlilik (opsiyonel)</label>
                  <input className="input" value={form.expiry} onChange={e => set("expiry", e.target.value)} placeholder="31 Ağustos 2025" />
                </div>
                <div>
                  <label className="label">Sıralama</label>
                  <input className="input" type="number" value={form.sort_order} onChange={e => set("sort_order", e.target.value)} placeholder="0" />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  id="active-toggle"
                  type="checkbox"
                  checked={form.active}
                  onChange={e => set("active", e.target.checked)}
                  style={{ accentColor: "#C41E3A", width: 15, height: 15, cursor: "pointer" }}
                />
                <label htmlFor="active-toggle" style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
                  Sitede yayınla (aktif)
                </label>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={13} />}
                  {saving ? "Kaydediliyor..." : editing ? "Güncelle" : "Yayınla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-panel" style={{ maxWidth: 380, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <Trash2 size={28} style={{ color: "#C41E3A", margin: "0 auto 1rem" }} />
            <div style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              Kampanyayı Sil
            </div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: "1.5rem" }}>
              Bu kampanya siteden kaldırılacak. Bu işlem geri alınamaz.
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn btn-primary" style={{ flex: 1, background: "#8B0000", borderColor: "#8B0000" }} onClick={() => handleDelete(deleteConfirm)}>
                <Trash2 size={13} /> Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
