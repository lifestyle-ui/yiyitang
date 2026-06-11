"use client";

import { useState, useEffect, useRef } from "react";
import { FlaskConical, Plus, Upload, Download, Search, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TestItem = {
  id: string;
  name: string;
  category: string | null;
  code: string | null;
  description: string | null;
  price: number | null;
  turnaround: string | null;
  notes: string | null;
};

const CATEGORIES = ["血液常規", "生化代謝", "荷爾蒙", "免疫", "過敏原", "基因檢測", "重金屬", "腸道菌相", "影像", "其他"];

export default function TestItemsPage() {
  const [items, setItems] = useState<TestItem[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "", category: "", code: "", description: "", price: "", turnaround: "", notes: "",
  });

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch("/api/test-items");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.category || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.code || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await fetch("/api/test-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", category: "", code: "", description: "", price: "", turnaround: "", notes: "" });
    setShowForm(false);
    fetchItems();
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

    await fetch("/api/test-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });

    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
    fetchItems();
  };

  const grouped = filtered.reduce((acc, t) => {
    const cat = t.category || "其他";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {} as Record<string, TestItem[]>);

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />檢測項目
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {items.length} 項檢測</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => {
            const csv = "name,category,code,description,price,turnaround,notes\n血脂四項,生化代謝,LIPID,總膽固醇/三酸甘油酯/HDL/LDL,500,3個工作天,需空腹採血\n血糖,生化代謝,GLU,空腹血糖,150,1個工作天,需空腹採血";
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "檢測項目範本.csv"; a.click();
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
          <CardHeader><CardTitle>新增檢測項目</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <Input label="項目名稱 *" placeholder="例：血脂四項" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">類別</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">請選擇類別</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="項目代碼" placeholder="例：LIPID" value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
              <Input label="費用（元）" type="number" placeholder="500" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              <Input label="說明" placeholder="檢測項目說明..." value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <Input label="回報時間" placeholder="例：3個工作天" value={form.turnaround}
                onChange={(e) => setForm((f) => ({ ...f, turnaround: e.target.value }))} />
              <Input label="注意事項" placeholder="例：需空腹採血" value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              <div className="col-span-2 flex justify-end">
                <Button type="submit">儲存</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋項目名稱、類別、代碼..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">載入中...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">{search ? "找不到符合的檢測項目" : "尚無檢測項目，請新增或匯入"}</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).sort().map(([cat, catItems]) => (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="text-base">{cat} <span className="text-sm font-normal text-slate-400">（{catItems.length} 項）</span></CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">項目名稱</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">代碼</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">說明</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">回報時間</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">費用</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {catItems.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{t.name}</td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{t.code || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">{t.description || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-500">{t.turnaround || "—"}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">
                          {t.price ? `$${t.price.toLocaleString()}` : "—"}
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
