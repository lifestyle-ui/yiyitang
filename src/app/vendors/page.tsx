"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { Building2, Plus, Pencil, Trash2, Phone, Mail, MapPin, User, ChevronDown, ChevronRight, Search, Upload, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

type Vendor = {
  id: string;
  name: string;
  category: string | null;
  contactPerson: string | null;
  contactTitle: string | null;
  phone: string | null;
  lineId: string | null;
  email: string | null;
  address: string | null;
  cooperation: string | null;
  bookingFlow: string | null;
  notes: string | null;
};

const CATEGORIES = ["診所", "檢驗所", "供應商", "醫美", "其他"];
const EMPTY = { name: "", category: "", contactPerson: "", contactTitle: "", phone: "", lineId: "", email: "", address: "", cooperation: "", bookingFlow: "", notes: "" };

function VendorForm({ initial, onSave, onCancel, saving }: {
  initial: typeof EMPTY; onSave: (v: typeof EMPTY) => void; onCancel: () => void; saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="廠商名稱 *" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="例：康健檢驗所" autoFocus />
        <Select label="類型" value={form.category} onChange={(e) => set("category", e.target.value)}
          options={[{ value: "", label: "— 請選擇 —" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="聯絡窗口" value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} placeholder="窗口姓名" />
        <Input label="窗口職稱" value={form.contactTitle} onChange={(e) => set("contactTitle", e.target.value)} placeholder="例：業務專員" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="電話" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <Input label="LINE" value={form.lineId} onChange={(e) => set("lineId", e.target.value)} />
        <Input label="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <Input label="地址" value={form.address} onChange={(e) => set("address", e.target.value)} />
      <Textarea label="合作方式" value={form.cooperation} onChange={(e) => set("cooperation", e.target.value)}
        placeholder="例：檢測轉介、抽成比例、結算方式、合約期間…" rows={3} />
      <Textarea label="預約流程" value={form.bookingFlow} onChange={(e) => set("bookingFlow", e.target.value)}
        placeholder="例：1. 先電話確認時段  2. 填寫轉介單傳真  3. 客人持單前往  4. 報告寄回本院…" rows={4} />
      <Textarea label="備註" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>取消</Button>
        <Button onClick={() => onSave(form)} disabled={saving || !form.name.trim()}>{saving ? "儲存中..." : "儲存"}</Button>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    const res = await fetch("/api/vendors");
    const data = await res.json();
    if (data.error) { setNeedsSetup(true); setVendors([]); }
    else setVendors(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async (v: typeof EMPTY) => {
    setSaving(true);
    const res = await fetch("/api/vendors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const data = await res.json();
    setSaving(false);
    if (data.error) { alert(data.error); return; }
    setAdding(false); load();
  };

  const update = async (id: string, v: typeof EMPTY) => {
    setSaving(true);
    await fetch(`/api/vendors/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    setSaving(false); setEditingId(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("確定刪除這個廠商？")) return;
    await fetch(`/api/vendors/${id}`, { method: "DELETE" });
    load();
  };

  const toggle = (id: string) => setExpanded((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = vendors.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [v.name, v.category, v.contactPerson, v.phone, v.lineId].some((x) => (x || "").toLowerCase().includes(q));
  });

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "#241f1b" }}>
            <Building2 className="w-5 h-5" style={{ color: "#5c4638" }} />廠商合作
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#8b8076" }}>診所、檢驗所等合作廠商的窗口、合作方式與預約流程</p>
        </div>
        {!adding && !needsSetup && <Button onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-1" />新增廠商</Button>}
      </div>

      {!needsSetup && vendors.length > 0 && (
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#b3a99d" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜尋廠商名稱、窗口、電話…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      )}

      {adding && (
        <Card className="mb-4"><CardContent className="py-5"><VendorForm initial={EMPTY} onSave={create} onCancel={() => setAdding(false)} saving={saving} /></CardContent></Card>
      )}

      {loading ? (
        <p className="text-sm text-center py-16" style={{ color: "#b3a99d" }}>載入中...</p>
      ) : needsSetup ? (
        <Card><CardContent className="py-10 text-center text-sm" style={{ color: "#8b8076" }}>資料表尚未建立，請先在 Supabase 執行建表 SQL。</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm" style={{ color: "#8b8076" }}>{search ? "找不到符合的廠商" : "尚無廠商資料，點右上角「新增廠商」開始建立"}</CardContent></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((v) => {
            const isOpen = expanded.has(v.id);
            const isEditing = editingId === v.id;
            if (isEditing) {
              return (
                <Card key={v.id}><CardContent className="py-5">
                  <VendorForm initial={{ ...EMPTY, ...Object.fromEntries(Object.entries(v).map(([k, val]) => [k, val ?? ""])) }}
                    onSave={(nv) => update(v.id, nv)} onCancel={() => setEditingId(null)} saving={saving} />
                </CardContent></Card>
              );
            }
            return (
              <Card key={v.id}>
                <div className="flex items-center gap-3 px-5 py-4">
                  <button onClick={() => toggle(v.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                    {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "#a89e91" }} /> : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#a89e91" }} />}
                    <span className="font-semibold truncate" style={{ color: "#241f1b" }}>{v.name}</span>
                    {v.category && <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: "#ece2d6", color: "#5c4638" }}>{v.category}</span>}
                    {v.contactPerson && <span className="text-xs truncate" style={{ color: "#8b8076" }}>· {v.contactPerson}{v.contactTitle ? `（${v.contactTitle}）` : ""}</span>}
                  </button>
                  <button onClick={() => setEditingId(v.id)} className="p-1.5 text-slate-300 hover:text-blue-500" title="編輯"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(v.id)} className="p-1.5 text-slate-300 hover:text-red-500" title="刪除"><Trash2 className="w-4 h-4" /></button>
                </div>
                {isOpen && (
                  <CardContent className="pt-0 pb-5 border-t border-slate-100">
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3 text-sm" style={{ color: "#4b4239" }}>
                      {v.contactPerson && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" style={{ color: "#a89e91" }} />{v.contactPerson}{v.contactTitle ? `（${v.contactTitle}）` : ""}</span>}
                      {v.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" style={{ color: "#a89e91" }} />{v.phone}</span>}
                      {v.lineId && <span className="flex items-center gap-1.5"><span className="text-xs font-bold" style={{ color: "#27AE60" }}>LINE</span>{v.lineId}</span>}
                      {v.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" style={{ color: "#a89e91" }} />{v.email}</span>}
                      {v.address && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" style={{ color: "#a89e91" }} />{v.address}</span>}
                    </div>
                    {v.cooperation && <Section title="合作方式" text={v.cooperation} />}
                    {v.bookingFlow && <Section title="預約流程" text={v.bookingFlow} />}
                    {v.notes && <Section title="備註" text={v.notes} />}
                    <VendorFiles vendorId={v.id} />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold mb-1" style={{ color: "#8b8076" }}>{title}</p>
      <p className="text-sm whitespace-pre-wrap leading-relaxed rounded-lg px-3 py-2" style={{ color: "#4b4239", background: "#faf7f1", border: "1px solid #ece5da" }}>{text}</p>
    </div>
  );
}

type VFile = { name: string; displayName: string; size: number | null; createdAt: string | null; url: string | null; isImage: boolean };

function VendorFiles({ vendorId }: { vendorId: string }) {
  const [files, setFiles] = useState<VFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await fetch(`/api/vendors/${vendorId}/files`);
    const data = await res.json();
    setFiles(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    e.target.value = "";
    setUploading(true);
    const fd = new FormData();
    selected.forEach((f) => fd.append("file", f));
    const res = await fetch(`/api/vendors/${vendorId}/files`, { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.error) alert(data.error);
    else if (data.failed?.length) alert(`部分檔案上傳失敗：\n${data.failed.join("\n")}`);
    load();
  };

  const rename = async (f: VFile) => {
    const newName = prompt("新檔名：", f.displayName.replace(/\.[^.]+$/, ""));
    if (!newName || !newName.trim()) return;
    const res = await fetch(`/api/vendors/${vendorId}/files`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.name, newName: newName.trim() }),
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    load();
  };

  const remove = async (name: string) => {
    if (!confirm("確定刪除這個檔案？")) return;
    await fetch(`/api/vendors/${vendorId}/files?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    load();
  };

  const fmtSize = (n: number | null) => n === null ? "" : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold" style={{ color: "#8b8076" }}>檔案（價目單、合約等）</p>
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded border transition-colors disabled:opacity-50"
          style={{ borderColor: "#d8cfc3", color: "#5c4638" }}>
          <Upload className="w-3 h-3" />{uploading ? "上傳中..." : "上傳檔案"}
        </button>
        <input ref={inputRef} type="file" accept=".pdf,image/*,.xlsx,.xls,.doc,.docx,.txt" multiple className="hidden" onChange={upload} />
      </div>
      {files.length === 0 ? (
        <p className="text-xs px-3 py-3 text-center rounded-lg" style={{ color: "#b3a99d", background: "#faf7f1", border: "1px solid #ece5da" }}>
          尚無檔案，可上傳價目單、合約、DM 等（PDF／圖片／Excel／Word）
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {files.map((f) => (
            <div key={f.name} className="border rounded-lg overflow-hidden bg-white flex flex-col" style={{ borderColor: "#ece5da" }}>
              {f.isImage && f.url ? (
                <a href={f.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={f.displayName} className="w-full h-24 object-cover bg-slate-50" />
                </a>
              ) : (
                <a href={f.url || "#"} target="_blank" rel="noreferrer" className="w-full h-24 flex items-center justify-center bg-slate-50">
                  <FileText className="w-8 h-8 text-slate-300" />
                </a>
              )}
              <div className="px-2 py-1.5 flex items-center justify-between gap-1 border-t" style={{ borderColor: "#f0ece5" }}>
                <a href={f.url || "#"} target="_blank" rel="noreferrer" className="text-[11px] font-medium truncate hover:underline" style={{ color: "#4b4239" }} title={f.displayName}>
                  {f.displayName}
                </a>
                <div className="flex items-center shrink-0">
                  <button onClick={() => rename(f)} className="p-0.5 text-slate-300 hover:text-blue-500" title="重新命名"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => remove(f.name)} className="p-0.5 text-slate-300 hover:text-red-500" title="刪除"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
