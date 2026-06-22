"use client";

import { useState, useEffect, useRef } from "react";
import { Pill, Plus, Upload, Download, Search, X, Tag } from "lucide-react";
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
  description: string | null; // 用於存放成分 / 關鍵字
};

const CATEGORIES = ["Omega 脂肪酸", "維生素", "礦物質", "益生菌", "草本植物", "酵素", "胺基酸", "抗氧化", "其他"];

// 同義詞字典：輸入中文俗名 → 展開為英文學名/縮寫
const SYNONYM_MAP: Record<string, string[]> = {
  "b群":       ["b complex", "b-complex", "vitamin b", "vit b", "b1", "b2", "b3", "b6", "b12", "thiamine", "riboflavin", "niacin", "pyridoxine", "cobalamin", "biotin", "folate", "folic acid", "pantothenic"],
  "維他命b":   ["b complex", "b-complex", "b1", "b2", "b3", "b6", "b12", "biotin", "folic"],
  "維生素b":   ["b complex", "b-complex", "b1", "b2", "b3", "b6", "b12"],
  "維他命c":   ["vitamin c", "vit c", "ascorbic", "ascorbate"],
  "維生素c":   ["vitamin c", "vit c", "ascorbic", "ascorbate"],
  "維他命d":   ["vitamin d", "vit d", "d3", "cholecalciferol"],
  "維生素d":   ["vitamin d", "vit d", "d3", "cholecalciferol"],
  "維他命e":   ["vitamin e", "vit e", "tocopherol", "e complex"],
  "維生素e":   ["vitamin e", "vit e", "tocopherol", "e complex"],
  "維他命a":   ["vitamin a", "vit a", "retinol", "beta-carotene", "β-carotene"],
  "維生素a":   ["vitamin a", "vit a", "retinol", "beta-carotene"],
  "魚油":      ["fish oil", "omega-3", "omega3", "epa", "dha"],
  "omega":     ["fish oil", "omega-3", "omega3", "epa", "dha", "魚油"],
  "omega3":    ["fish oil", "epa", "dha", "魚油"],
  "coq10":     ["coenzyme q10", "coq", "ubiquinol", "ubiquinone", "輔酶q10"],
  "q10":       ["coq10", "coenzyme q10", "ubiquinol", "ubiquinone"],
  "輔酶":      ["coq10", "coenzyme q", "ubiquinol"],
  "鎂":        ["magnesium", "mag", "citrate", "glycinate", "threonate"],
  "鋅":        ["zinc", "gluconate", "picolinate"],
  "鈣":        ["calcium", "carbonate", "hydroxyapatite"],
  "鐵":        ["iron", "ferrous", "ferric"],
  "碘":        ["iodine", "iodide", "kelp"],
  "硒":        ["selenium", "selenomethionine"],
  "益生菌":    ["probiotic", "lactobacillus", "bifidobacterium", "acidophilus"],
  "乳酸菌":   ["lactobacillus", "probiotic", "acidophilus"],
  "褪黑激素":  ["melatonin"],
  "麩胱甘肽":  ["glutathione", "gsh"],
  "薑黃":      ["turmeric", "curcumin", "curcuminoid"],
  "薑黃素":    ["curcumin", "turmeric"],
  "葉黃素":    ["lutein", "zeaxanthin"],
  "膠原蛋白":  ["collagen", "gelatin", "hydroxyproline"],
  "dhea":      ["dehydroepiandrosterone"],
  "msm":       ["methylsulfonylmethane", "dimethyl sulfone"],
  "nac":       ["n-acetyl cysteine", "n-acetylcysteine", "acetylcysteine"],
  "5htp":      ["5-hydroxytryptophan", "5-htp", "tryptophan"],
  "5-htp":     ["5-hydroxytryptophan", "tryptophan"],
  "melatonin": ["褪黑激素", "melatonin"],
  "omega-3":   ["fish oil", "epa", "dha", "魚油"],
  "人參":      ["ginseng", "panax", "ginsenoside"],
  "靈芝":      ["reishi", "ganoderma"],
  "冬蟲夏草":  ["cordyceps"],
  "白藜蘆醇":  ["resveratrol"],
  "花青素":    ["anthocyanin", "bilberry"],
  "綠茶":      ["egcg", "green tea", "catechin"],
};

function expandSearchTerms(query: string): string[] {
  const lower = query.toLowerCase().trim();
  const base = [lower];
  const expanded = SYNONYM_MAP[lower] ?? [];
  // also try prefix match
  for (const [key, vals] of Object.entries(SYNONYM_MAP)) {
    if (lower.length >= 2 && key.startsWith(lower) && !base.includes(key)) {
      base.push(key);
      base.push(...vals);
    }
  }
  return [...new Set([...base, ...expanded])];
}

function matchProduct(product: Product, terms: string[]): boolean {
  const fields = [
    product.name,
    product.brand,
    product.category,
    product.spec,
    product.dosage,
    product.notes,
    product.description,
  ].map((f) => (f ?? "").toLowerCase());

  return terms.some((term) => fields.some((f) => f.includes(term)));
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "", category: "", brand: "", spec: "", dosage: "", unit: "顆", price: "", notes: "", description: "",
  });

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
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", category: "", brand: "", spec: "", dosage: "", unit: "顆", price: "", notes: "", description: "" });
    setShowForm(false);
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
        .map((r) => {
          const row: Record<string, string> = {};
          for (const k in r) row[k.trim()] = String(r[k] ?? "").trim();
          return row;
        })
        .filter((r) => r.name);
      await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
      fetchProducts();
    }
  };

  const grouped = filtered.reduce((acc, p) => {
    const cat = p.category || "其他";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  const matchedTerms = search.trim() ? expandSearchTerms(search) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "#1A1A1A" }}>
            <Pill className="w-5 h-5" style={{ color: "#2C4A3E" }} />保健品目錄
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#8A8580" }}>共 {products.length} 項保健品</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => {
            const csv = "name,category,brand,spec,dosage,unit,price,notes,description\n魚油,Omega 脂肪酸,Nordic Naturals,1000mg,每日2顆飯後,顆,800,,fish oil omega-3 EPA DHA\n維生素D3,維生素,,2000IU,每日1顆,顆,500,,vitamin D D3 cholecalciferol";
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "保健品範本.csv"; a.click();
          }}>
            <Download className="w-4 h-4" />下載範本
          </Button>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload className="w-4 h-4" />{importing ? "匯入中..." : "CSV 匯入"}
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
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
                  className="px-3 py-2 text-sm rounded-sm border bg-white focus:outline-none focus:ring-1" style={{ borderColor: "#DDDAD4" }}>
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
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <Tag className="w-3 h-3" />成分 / 搜尋關鍵字
                </label>
                <input value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="例：B6 pyridoxine folic acid folate B complex"
                  className="px-3 py-2 text-sm rounded-sm border bg-white focus:outline-none focus:ring-1" style={{ borderColor: "#DDDAD4" }} />
              </div>
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
      <div className="relative mb-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A8A5A0" }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋品名、品牌、成分…　例：B群、維他命C、CoQ10、魚油"
          className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-sm bg-white focus:outline-none focus:ring-1"
          style={{ borderColor: "#DDDAD4" }} />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#A8A5A0" }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 搜尋展開提示 */}
      {search.trim() && matchedTerms.length > 1 && (
        <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: "#8A8580" }}>
          <Tag className="w-3 h-3" />
          自動展開搜尋：{matchedTerms.slice(0, 8).join("、")}{matchedTerms.length > 8 ? ` 等 ${matchedTerms.length} 個關鍵字` : ""}
        </p>
      )}
      {search.trim() && matchedTerms.length <= 1 && <div className="mb-3" />}

      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: "#A8A5A0" }}>載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border rounded-sm" style={{ borderColor: "#ECEAE6" }}>
          <Pill className="w-10 h-10 mx-auto mb-3" style={{ color: "#DDDAD4" }} />
          <p className="text-sm" style={{ color: "#8A8580" }}>{search ? `找不到「${search}」相關的保健品` : "尚無保健品資料，請新增或匯入"}</p>
          {search && <p className="text-xs mt-1" style={{ color: "#A8A5A0" }}>可在「成分 / 搜尋關鍵字」欄位補充成分名稱以提升搜尋精準度</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).sort().map(([cat, items]) => (
            <div key={cat} className="border rounded-sm overflow-hidden" style={{ borderColor: "#ECEAE6" }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#F9F8F6", borderBottom: "1px solid #ECEAE6" }}>
                <span className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{cat}</span>
                <span className="text-xs" style={{ color: "#A8A5A0" }}>（{items.length} 項）</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #F2F0EC", background: "#FAFAF8" }}>
                    <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: "#8A8580" }}>品名</th>
                    <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: "#8A8580" }}>品牌</th>
                    <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: "#8A8580" }}>規格</th>
                    <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: "#8A8580" }}>建議用法</th>
                    <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: "#8A8580" }}>成分標籤</th>
                    <th className="text-right px-4 py-2 text-xs font-medium" style={{ color: "#8A8580" }}>售價</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F9F8F6]" style={{ borderBottom: "1px solid #F2F0EC" }}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: "#1A1A1A" }}>{p.name}</td>
                      <td className="px-4 py-2.5" style={{ color: "#6A6560" }}>{p.brand || "—"}</td>
                      <td className="px-4 py-2.5" style={{ color: "#6A6560" }}>{p.spec || "—"}</td>
                      <td className="px-4 py-2.5" style={{ color: "#6A6560" }}>{p.dosage || "—"}</td>
                      <td className="px-4 py-2.5 max-w-[200px]">
                        {p.description ? (
                          <span className="text-xs rounded-sm px-1.5 py-0.5 truncate block" style={{ background: "#EFF4F1", color: "#2C4A3E" }}>
                            {p.description}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right" style={{ color: "#6A6560" }}>
                        {p.price ? `$${p.price.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
