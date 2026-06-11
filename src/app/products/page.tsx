"use client";

import { useState, useEffect, useRef } from "react";
import { Pill, Plus, Upload, Download, Search, X } from "lucide-react";
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
  price: number | null;
  notes: string | null;
};

const CATEGORIES = ["Omega 脂肪酸", "維生素", "礦物質", "益生菌", "草本植物", "酵素", "胺基酸", "抗氧化", "其他"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "", category: "", brand: "", spec: "", dosage: "", unit: "顆", price: "", notes: "",
  });

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.brand || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", category: "", brand: "", spec: "", dosage: "", unit: "顆", price: "", notes: "" });
    setShowForm(false);
    fetchProducts();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ""; });
      return obj;
    }).filter((r) => r.name);

    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });

    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
    fetchProducts();
  };

  const grouped = filtered.reduce((acc, p) => {
    const cat = p.category || "其他";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />保健品目錄
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {products.length} 項保健品</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => {
            const csv = "name,category,brand,spec,dosage,unit,price,notes\n魚油,Omega 脂肪酸,Nordic Naturals,1000mg,每日2顆飯後,顆,800,\n維生素D3,維生素,,2000IU,每日1顆,顆,500,";
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "保健品範本.csv"; a.click();
          }}>
            <Download className="w-4 h-4" />下載範本
          </Button>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload className="w-4 h-4" />{importing ? "匯入中..." : "CSV 匯入"}
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "取消" : "手動新增"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-5">
          <CardHeader><CardTitle>新增保健品</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <Input label="品名 *" placeholder="例：魚油" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">類別</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">請選擇類別</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="品牌" placeholder="例：Nordic Naturals" value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
              <Input label="規格" placeholder="例：1000mg" value={form.spec}
                onChange={(e) => setForm((f) => ({ ...f, spec: e.target.value }))} />
              <Input label="建議用法" placeholder="例：每日 2 顆，飯後" value={form.dosage}
                onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} />
              <Input label="單位" placeholder="顆" value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
              <Input label="售價（元）" type="number" placeholder="800" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              <Input label="備註" placeholder="注意事項..." value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              <div className="col-span-2 flex justify-end">
                <Button type="submit">儲存</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 搜尋 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋品名、類別、品牌..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">載入中...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">{search ? "找不到符合的保健品" : "尚無保健品資料，請新增或匯入"}</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).sort().map(([cat, items]) => (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="text-base">{cat} <span className="text-sm font-normal text-slate-400">（{items.length} 項）</span></CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">品名</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">品牌</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">規格</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">建議用法</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">售價</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.brand || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.spec || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.dosage || "—"}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">
                          {p.price ? `$${p.price.toLocaleString()}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
