"use client";

import { useState, useEffect, useRef } from "react";
import { Pill, Plus, Upload, Download, Search, X, Tag, Pencil, Trash2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Product = {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  spec: string | null;
  dosage: string | null;
  unit: string;
  price: number | null;       // 建議售價（整罐）
  code: string | null;        // 商品代碼
  pillCount: number | null;   // 顆數（整罐顆數）
  vendor: string | null;      // 廠商
  notes: string | null;
  description: string | null; // 成分 / 搜尋關鍵字
};

const CATEGORIES = ["Omega 脂肪酸", "維生素", "礦物質", "益生菌", "草本植物", "酵素", "胺基酸", "抗氧化", "其他"];
const VENDORS = ["亞星 Xymogen", "中華生醫", "營養品", "瀚仕", "其他"];

// 單顆價 = 建議售價 ÷ 顆數，無條件進位
export function perPillPrice(price: number | null, pillCount: number | null): number | null {
  if (!price || !pillCount || pillCount <= 0) return null;
  return Math.ceil(price / pillCount);
}

const SYNONYM_MAP: Record<string, string[]> = {
  "b群": ["b complex", "b-complex", "vitamin b", "vit b", "b1", "b2", "b3", "b6", "b12", "thiamine", "riboflavin", "niacin", "pyridoxine", "cobalamin", "biotin", "folate", "folic acid", "pantothenic"],
  "維他命c": ["vitamin c", "vit c", "ascorbic", "ascorbate"],
  "維生素c": ["vitamin c", "vit c", "ascorbic", "ascorbate"],
  "維他命d": ["vitamin d", "vit d", "d3", "cholecalciferol"],
  "維生素d": ["vitamin d", "vit d", "d3", "cholecalciferol"],
  "魚油": ["fish oil", "omega-3", "omega3", "epa", "dha"],
  "coq10": ["coenzyme q10", "coq", "ubiquinol", "ubiquinone", "輔酶q10"],
  "鎂": ["magnesium", "mag", "citrate", "glycinate", "threonate"],
  "鋅": ["zinc", "gluconate", "picolinate"],
  "鈣": ["calcium", "carbonate", "hydroxyapatite"],
  "鐵": ["iron", "ferrous", "ferric"],
  "益生菌": ["probiotic", "lactobacillus", "bifidobacterium", "acidophilus"],
  "薑黃": ["turmeric", "curcumin", "curcuminoid"],
  "dhea": ["dehydroepiandrosterone"],
  "msm": ["methylsulfonylmethane", "dimethyl sulfone"],
  "nac": ["n-acetyl cysteine", "n-acetylcysteine", "acetylcysteine"],
};

function expandSearchTerms(query: string): string[] {
  const lower = query.toLowerCase().trim();
  const base = [lower];
  const expanded = SYNONYM_MAP[lower] ?? [];
  for (const [key, vals] of Object.entries(SYNONYM_MAP)) {
    if (lower.length >= 2 && key.startsWith(lower) && !base.includes(key)) { base.push(key); base.push(...vals); }
  }
  return [...new Set([...base, ...expanded])];
}

function matchProduct(product: Product, terms: string[]): boolean {
  const fields = [product.name, product.brand, product.category, product.spec, product.dosage, product.notes, product.description, product.code, product.vendor]
    .map((f) => (f ?? "").toLowerCase());
  return terms.some((term) => fields.some((f) => f.includes(term)));
}

const EMPTY = { name: "", category: "", brand: "", spec: "", dosage: "", unit: "顆", price: "", code: "", pillCount: "", vendor: "", notes: "", description: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY });

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  useEffect(() => { fetchProducts(); }, []);

  const filtered = (() => {
    if (!search.trim()) return products;
    const terms = expandSearchTerms(search);
    return products.filter((p) => matchProduct(p, terms));
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ ...EMPTY });
    setShowForm(false);
    fetchProducts();
  };

  const startEdit = (p: Product) => {
    setEditId(p.id);
    setEditForm({
      name: p.name, category: p.category || "", brand: p.brand || "", spec: p.spec || "", dosage: p.dosage || "",
      unit: p.unit || "顆", price: p.price?.toString() || "", code: p.code || "", pillCount: p.pillCount?.toString() || "",
      vendor: p.vendor || "", notes: p.notes || "", description: p.description || "",
    });
  };
  const saveEdit = async () => {
    await fetch(`/api/products/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setEditId(null);
    fetchProducts();
  };
  const remove = async (id: string) => {
    if (!confirm("確定刪除這個保健品？")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = (XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[])
        .map((r) => { const row: Record<string, string> = {}; for (const k in r) row[k.trim()] = String(r[k] ?? "").trim(); return row; })
        .filter((r) => r.name);
      await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
      fetchProducts();
    }
  };

  const grouped = filtered.reduce((acc, p) => { const cat = p.vendor || p.category || "其他"; (acc[cat] ||= []).push(p); return acc; }, {} as Record<string, Product[]>);
  const matchedTerms = search.trim() ? expandSearchTerms(search) : [];

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "#241f1b" }}>
            <Pill className="w-5 h-5" style={{ color: "#5c4638" }} />保健品目錄
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#8b8076" }}>共 {products.length} 項　·　售價與顆數用於報價單計算</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => {
            const csv = "name,code,vendor,brand,spec,pillCount,price,dosage,unit,category,description,notes\nDigestive Complete 酵素,ND001,亞星 Xymogen,NutriDyn,60c,60,2760,隨餐1顆,顆,酵素,digestive enzyme,\nDHEA Micronized 25mg,X024,亞星 Xymogen,Xymogen,60t,60,1780,每日1顆,顆,,dhea,";
            const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "保健品範本.csv"; a.click();
          }}><Download className="w-4 h-4" />下載範本</Button>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload className="w-4 h-4" />{importing ? "匯入中..." : "CSV 匯入"}
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{showForm ? "取消" : "手動新增"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-5">
          <CardHeader><CardTitle>新增保健品</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
              <Input label="品名 *" placeholder="例：DHEA Micronized 25mg" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <Input label="商品代碼" placeholder="例：X024" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">廠商</label>
                <select value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-sm border bg-white focus:outline-none focus:ring-1" style={{ borderColor: "#d8cfc3" }}>
                  <option value="">請選擇廠商</option>
                  {VENDORS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <Input label="顆數（整罐）" type="number" placeholder="例：60" value={form.pillCount} onChange={(e) => setForm((f) => ({ ...f, pillCount: e.target.value }))} />
              <Input label="建議售價（整罐/元）" type="number" placeholder="例：2760" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">單顆價（自動）</label>
                <div className="px-3 py-2 text-sm rounded-sm border bg-slate-50" style={{ borderColor: "#ece5da", color: "#5c4638" }}>
                  {perPillPrice(form.price ? +form.price : null, form.pillCount ? +form.pillCount : null) ?? "—"}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">類別</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-sm border bg-white focus:outline-none focus:ring-1" style={{ borderColor: "#d8cfc3" }}>
                  <option value="">請選擇類別</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="規格" placeholder="例：60c / 90t" value={form.spec} onChange={(e) => setForm((f) => ({ ...f, spec: e.target.value }))} />
              <Input label="建議用法" placeholder="例：每日 1 顆" value={form.dosage} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} />
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Tag className="w-3 h-3" />成分 / 搜尋關鍵字</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="例：dhea dehydroepiandrosterone" className="px-3 py-2 text-sm rounded-sm border bg-white focus:outline-none focus:ring-1" style={{ borderColor: "#d8cfc3" }} />
              </div>
              <Input label="備註" placeholder="注意事項..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              <div className="col-span-3 flex justify-end"><Button type="submit">儲存</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#b3a99d" }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜尋品名、代碼、廠商、成分…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-sm bg-white focus:outline-none focus:ring-1" style={{ borderColor: "#d8cfc3" }} />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#b3a99d" }}><X className="w-4 h-4" /></button>}
      </div>
      {search.trim() && matchedTerms.length > 1 && (
        <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: "#8b8076" }}><Tag className="w-3 h-3" />
          自動展開：{matchedTerms.slice(0, 8).join("、")}{matchedTerms.length > 8 ? ` 等 ${matchedTerms.length} 個` : ""}</p>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: "#b3a99d" }}>載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border rounded-sm" style={{ borderColor: "#ece5da" }}>
          <Pill className="w-10 h-10 mx-auto mb-3" style={{ color: "#d8cfc3" }} />
          <p className="text-sm" style={{ color: "#8b8076" }}>{search ? `找不到「${search}」相關的保健品` : "尚無保健品資料，請新增或匯入"}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).sort().map(([cat, items]) => (
            <div key={cat} className="border rounded-sm overflow-hidden" style={{ borderColor: "#ece5da" }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#f3ece0", borderBottom: "1px solid #ece5da" }}>
                <span className="text-sm font-semibold" style={{ color: "#241f1b" }}>{cat}</span>
                <span className="text-xs" style={{ color: "#b3a99d" }}>（{items.length} 項）</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ece5da", background: "#FAFAF8" }}>
                      <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#8b8076" }}>代碼</th>
                      <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#8b8076" }}>品名</th>
                      <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "#8b8076" }}>規格</th>
                      <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: "#8b8076" }}>顆數</th>
                      <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: "#8b8076" }}>整罐售價</th>
                      <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: "#8b8076" }}>單顆</th>
                      <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: "#8b8076" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => editId === p.id ? (
                      <tr key={p.id} style={{ borderBottom: "1px solid #ece5da", background: "#FFFBF0" }}>
                        <td className="px-2 py-1.5"><input value={editForm.code} onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))} className="w-16 px-1.5 py-1 text-xs border rounded" style={{ borderColor: "#d8cfc3" }} /></td>
                        <td className="px-2 py-1.5"><input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="w-full min-w-[160px] px-1.5 py-1 text-xs border rounded" style={{ borderColor: "#d8cfc3" }} /></td>
                        <td className="px-2 py-1.5"><input value={editForm.spec} onChange={(e) => setEditForm((f) => ({ ...f, spec: e.target.value }))} className="w-14 px-1.5 py-1 text-xs border rounded" style={{ borderColor: "#d8cfc3" }} /></td>
                        <td className="px-2 py-1.5"><input type="number" value={editForm.pillCount} onChange={(e) => setEditForm((f) => ({ ...f, pillCount: e.target.value }))} className="w-16 px-1.5 py-1 text-xs border rounded text-right" style={{ borderColor: "#d8cfc3" }} /></td>
                        <td className="px-2 py-1.5"><input type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} className="w-20 px-1.5 py-1 text-xs border rounded text-right" style={{ borderColor: "#d8cfc3" }} /></td>
                        <td className="px-3 py-1.5 text-right text-xs" style={{ color: "#5c4638" }}>{perPillPrice(editForm.price ? +editForm.price : null, editForm.pillCount ? +editForm.pillCount : null) ?? "—"}</td>
                        <td className="px-2 py-1.5 text-right whitespace-nowrap">
                          <button onClick={saveEdit} className="p-1 text-green-600 hover:text-green-700" title="儲存"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditId(null)} className="p-1 text-slate-400 hover:text-slate-600" title="取消"><X className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={p.id} className="hover:bg-[#f3ece0]" style={{ borderBottom: "1px solid #ece5da" }}>
                        <td className="px-3 py-2.5 font-mono text-xs" style={{ color: "#8b8076" }}>{p.code || "—"}</td>
                        <td className="px-3 py-2.5 font-medium" style={{ color: "#241f1b" }}>{p.name}{p.brand && <span className="text-xs ml-1.5" style={{ color: "#b3a99d" }}>{p.brand}</span>}</td>
                        <td className="px-3 py-2.5" style={{ color: "#6b6056" }}>{p.spec || "—"}</td>
                        <td className="px-3 py-2.5 text-right" style={{ color: "#6b6056" }}>{p.pillCount ?? "—"}</td>
                        <td className="px-3 py-2.5 text-right" style={{ color: "#241f1b" }}>{p.price ? `$${p.price.toLocaleString()}` : "—"}</td>
                        <td className="px-3 py-2.5 text-right font-medium" style={{ color: "#5c4638" }}>{perPillPrice(p.price, p.pillCount) != null ? `$${perPillPrice(p.price, p.pillCount)}` : "—"}</td>
                        <td className="px-2 py-2.5 text-right whitespace-nowrap">
                          <button onClick={() => startEdit(p)} className="p-1 text-slate-300 hover:text-blue-500" title="編輯"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => remove(p.id)} className="p-1 text-slate-300 hover:text-red-500" title="刪除"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
