"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, Search, FileDown, Save } from "lucide-react";
import { perPillPrice } from "@/app/products/page";

type Product = { id: string; name: string; code: string | null; price: number | null; pillCount: number | null; vendor: string | null; unit: string };
type UnitType = "整罐" | "單顆";
export type QuoteLine = { code: string; name: string; unitType: UnitType; unitPrice: number; qty: number; note: string };
export type QuoteData = {
  id?: string;
  orderNo: string; orderDate: string; orderType: string;
  clientId?: string | null; clientName: string;
  items: QuoteLine[]; shipping: number; notes: string; prescriptionId?: string | null;
};

// Normalize a name for fuzzy matching: drop dosage tokens, keep meaningful words
function norm(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/\d+\s*#|\bbid\b|\btid\b|\bqd\b|\bqid\b|\bqhs\b|\bprn\b/g, " ")
    .replace(/[（(].*?[)）]/g, " ")
    .replace(/避光|凍|每日|飯前|飯後|睡前|亞星|瀚仕|補一/g, " ")
    .replace(/[^a-z0-9一-鿿]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 || /[一-鿿]{2,}/.test(t));
}

// Match a prescription item name to the best product in the catalog
function matchProduct(rxName: string, products: Product[]): Product | null {
  const rxTokens = norm(rxName);
  if (rxTokens.length === 0) return null;
  let best: Product | null = null, bestScore = 0;
  for (const p of products) {
    const pTokens = new Set([...norm(p.name), ...(p.code ? [p.code.toLowerCase()] : [])]);
    let score = 0;
    for (const t of rxTokens) if (pTokens.has(t)) score += t.length;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return bestScore >= 3 ? best : null;
}

// Build quote lines from prescription items, matched against the catalog
export function buildLinesFromPrescription(
  rxItems: { name: string; dosage?: string }[],
  products: Product[]
): { lines: QuoteLine[]; unmatched: string[] } {
  const lines: QuoteLine[] = [];
  const unmatched: string[] = [];
  for (const it of rxItems) {
    if (!it.name?.trim()) continue;
    const p = matchProduct(it.name, products);
    if (p) {
      const per = perPillPrice(p.price, p.pillCount);
      lines.push({
        code: p.code || "",
        name: p.name,
        unitType: per != null ? "單顆" : "整罐",
        unitPrice: per ?? p.price ?? 0,
        qty: 1,
        note: it.dosage || "",
      });
    } else {
      unmatched.push(it.name);
    }
  }
  return { lines, unmatched };
}

export function todayISO() { return new Date().toISOString().slice(0, 10); }
export function genOrderNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `SO-${ymd}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

export default function QuoteEditor({ initial, unmatched, onClose, onSaved }: {
  initial: QuoteData; unmatched?: string[]; onClose: () => void; onSaved?: () => void;
}) {
  const [q, setQ] = useState<QuoteData>(initial);
  const [products, setProducts] = useState<Product[]>([]);
  const [pick, setPick] = useState(false);
  const [pickSearch, setPickSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetch("/api/products").then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : [])); }, []);

  const setLine = (i: number, patch: Partial<QuoteLine>) =>
    setQ((s) => ({ ...s, items: s.items.map((l, idx) => idx === i ? { ...l, ...patch } : l) }));
  const removeLine = (i: number) => setQ((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }));
  const addProduct = (p: Product) => {
    const per = perPillPrice(p.price, p.pillCount);
    setQ((s) => ({ ...s, items: [...s.items, { code: p.code || "", name: p.name, unitType: per != null ? "單顆" : "整罐", unitPrice: per ?? p.price ?? 0, qty: 1, note: "" }] }));
    setPick(false); setPickSearch("");
  };
  const addBlank = () => setQ((s) => ({ ...s, items: [...s.items, { code: "", name: "", unitType: "單顆", unitPrice: 0, qty: 1, note: "" }] }));

  // Changing unit type re-derives the unit price from the matched product
  const changeUnitType = (i: number, ut: UnitType) => {
    const line = q.items[i];
    const p = products.find((x) => (line.code && x.code === line.code) || x.name === line.name);
    let price = line.unitPrice;
    if (p) price = ut === "單顆" ? (perPillPrice(p.price, p.pillCount) ?? line.unitPrice) : (p.price ?? line.unitPrice);
    setLine(i, { unitType: ut, unitPrice: price });
  };

  const subtotal = useMemo(() => q.items.reduce((s, l) => s + l.unitPrice * l.qty, 0), [q.items]);
  const total = subtotal + (q.shipping || 0);

  const pickFiltered = products.filter((p) => {
    if (!pickSearch.trim()) return true;
    const s = pickSearch.toLowerCase();
    return [p.name, p.code, p.vendor].some((x) => (x || "").toLowerCase().includes(s));
  }).slice(0, 40);

  const save = async () => {
    setSaving(true);
    const payload = { ...q, items: q.items, total };
    try {
      if (q.id) await fetch(`/api/quotes/${q.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      else {
        const res = await fetch("/api/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const created = await res.json();
        if (created.id) setQ((s) => ({ ...s, id: created.id }));
      }
      onSaved?.();
    } finally { setSaving(false); }
  };

  const exportPDF = async () => {
    setExporting(true);
    const rows = q.items.map((l, i) => `<tr>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;font-size:13px;">${i + 1}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;font-size:13px;color:#6b6056;">${l.code || ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;font-size:13px;">${l.name}${l.unitType === "整罐" ? " (整罐)" : ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;font-size:13px;text-align:right;">$${l.unitPrice.toLocaleString()}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;font-size:13px;text-align:right;">${l.qty}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;font-size:13px;text-align:right;">$${(l.unitPrice * l.qty).toLocaleString()}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;font-size:12px;color:#8b8076;">${l.note || ""}</td></tr>`).join("");
    const shipRow = q.shipping ? `<tr>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;font-size:13px;">${q.items.length + 1}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;"></td>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;font-size:13px;">運費</td>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;font-size:13px;text-align:right;">$${q.shipping.toLocaleString()}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;font-size:13px;text-align:right;">1</td>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;font-size:13px;text-align:right;">$${q.shipping.toLocaleString()}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #ece5da;"></td></tr>` : "";

    const div = document.createElement("div");
    div.style.cssText = "position:fixed;left:-9999px;top:0;width:720px;background:#fff;padding:44px 40px;font-family:'Noto Serif TC',sans-serif;color:#241f1b;";
    div.innerHTML = `
      <div style="text-align:center;font-size:24px;font-weight:bold;margin-bottom:24px;">意一堂健康管理</div>
      <div style="font-size:14px;font-weight:bold;margin-bottom:8px;color:#5c4638;">訂單總表</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;font-size:13px;color:#4b4239;margin-bottom:24px;">
        <div><span style="color:#8b8076;">訂單編號　</span>${q.orderNo || ""}</div>
        <div><span style="color:#8b8076;">訂單單別　</span>${q.orderType || "一般訂單"}</div>
        <div><span style="color:#8b8076;">訂單日期　</span>${q.orderDate || ""}</div>
        <div><span style="color:#8b8076;">客戶名稱　</span>${q.clientName || ""}</div>
      </div>
      <div style="font-size:14px;font-weight:bold;margin-bottom:8px;color:#5c4638;">項目</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f3ece0;">
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#5c4638;">項次</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#5c4638;">商品代碼</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#5c4638;">商品名稱</th>
          <th style="padding:8px 10px;text-align:right;font-size:12px;color:#5c4638;">單價</th>
          <th style="padding:8px 10px;text-align:right;font-size:12px;color:#5c4638;">數量</th>
          <th style="padding:8px 10px;text-align:right;font-size:12px;color:#5c4638;">金額</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#5c4638;">備註</th>
        </tr></thead>
        <tbody>${rows}${shipRow}</tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-top:16px;">
        <div style="min-width:220px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 10px;background:#f7f4ef;">
            <span style="color:#8b8076;">合計</span><span>$${subtotal.toLocaleString()}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:bold;padding:8px 10px;background:#f3ece0;">
            <span>總金額</span><span>$${total.toLocaleString()}</span></div>
        </div>
      </div>
      <div style="display:flex;gap:24px;font-size:12px;color:#6b6056;margin-top:20px;">
        <span>匯率　1</span>${q.notes ? `<span>備註　${q.notes}</span>` : ""}
      </div>
      <div style="margin-top:28px;font-size:11px;color:#b3a99d;border-top:1px solid #ece5da;padding-top:12px;">
        此報價單由意一堂健康管理系統產生。單顆價 = 建議售價 ÷ 顆數（無條件進位）。
      </div>`;
    document.body.appendChild(div);
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
    const canvas = await html2canvas(div, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    document.body.removeChild(div);
    const imgW = 190, imgH = (canvas.height * imgW) / canvas.width;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, imgW, imgH);
    pdf.save(`報價單_${q.clientName || ""}_${q.orderDate}.pdf`);
    setExporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#5a5e63" }}>
      <header className="flex items-center gap-3 px-4" style={{ flex: "none", height: 52, background: "#1f2226", color: "#eef0f2" }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>報價單</div>
        <div style={{ fontSize: 11, color: "#9aa0a6" }}>{q.id ? "編輯中" : "新報價單"}</div>
        <div style={{ flex: 1 }} />
        <button onClick={exportPDF} disabled={exporting} className="flex items-center gap-1.5 px-3 h-8 rounded text-xs" style={{ border: "1px solid #44494f", color: "#cfd3d7" }}>
          <FileDown className="w-3.5 h-3.5" />{exporting ? "產生中…" : "產生 PDF"}
        </button>
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 h-8 rounded text-xs font-semibold" style={{ background: "#3b82f6", color: "#fff" }}>
          <Save className="w-3.5 h-3.5" />{saving ? "儲存中…" : "儲存"}
        </button>
        <button onClick={onClose} className="px-3 h-8 rounded text-xs" style={{ border: "1px solid #44494f", color: "#cfd3d7" }}>關閉</button>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6">
          {/* Header fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <L label="訂單編號"><input value={q.orderNo} onChange={(e) => setQ((s) => ({ ...s, orderNo: e.target.value }))} className="inp" /></L>
            <L label="訂單日期"><input type="date" value={q.orderDate} onChange={(e) => setQ((s) => ({ ...s, orderDate: e.target.value }))} className="inp" /></L>
            <L label="訂單單別"><input value={q.orderType} onChange={(e) => setQ((s) => ({ ...s, orderType: e.target.value }))} className="inp" /></L>
            <L label="客戶名稱"><input value={q.clientName} onChange={(e) => setQ((s) => ({ ...s, clientName: e.target.value }))} className="inp" /></L>
          </div>

          {unmatched && unmatched.length > 0 && (
            <div className="mb-4 text-xs px-3 py-2 rounded" style={{ background: "#FEF3C7", color: "#92400E" }}>
              以下處方項目在價目表找不到對應，未加入報價（可用「＋ 從價目表」手動加入）：{unmatched.join("、")}
            </div>
          )}

          {/* Line items */}
          <div className="overflow-x-auto border rounded-lg" style={{ borderColor: "#ece5da" }}>
            <table className="w-full text-sm">
              <thead><tr style={{ background: "#f3ece0" }}>
                <th className="px-2 py-2 text-left text-xs" style={{ color: "#5c4638", width: 90 }}>代碼</th>
                <th className="px-2 py-2 text-left text-xs" style={{ color: "#5c4638" }}>商品名稱</th>
                <th className="px-2 py-2 text-center text-xs" style={{ color: "#5c4638", width: 90 }}>計價</th>
                <th className="px-2 py-2 text-right text-xs" style={{ color: "#5c4638", width: 90 }}>單價</th>
                <th className="px-2 py-2 text-right text-xs" style={{ color: "#5c4638", width: 70 }}>數量</th>
                <th className="px-2 py-2 text-right text-xs" style={{ color: "#5c4638", width: 90 }}>金額</th>
                <th className="px-2 py-2 text-left text-xs" style={{ color: "#5c4638", width: 110 }}>備註</th>
                <th style={{ width: 34 }}></th>
              </tr></thead>
              <tbody>
                {q.items.map((l, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #ece5da" }}>
                    <td className="px-1.5 py-1"><input value={l.code} onChange={(e) => setLine(i, { code: e.target.value })} className="w-full px-1.5 py-1 text-xs border rounded" style={{ borderColor: "#e5e0d8" }} /></td>
                    <td className="px-1.5 py-1"><input value={l.name} onChange={(e) => setLine(i, { name: e.target.value })} className="w-full min-w-[150px] px-1.5 py-1 text-xs border rounded" style={{ borderColor: "#e5e0d8" }} /></td>
                    <td className="px-1.5 py-1">
                      <select value={l.unitType} onChange={(e) => changeUnitType(i, e.target.value as UnitType)} className="w-full px-1 py-1 text-xs border rounded bg-white" style={{ borderColor: "#e5e0d8" }}>
                        <option value="單顆">單顆</option><option value="整罐">整罐</option>
                      </select>
                    </td>
                    <td className="px-1.5 py-1"><input type="number" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: +e.target.value })} className="w-full px-1.5 py-1 text-xs border rounded text-right" style={{ borderColor: "#e5e0d8" }} /></td>
                    <td className="px-1.5 py-1"><input type="number" value={l.qty} onChange={(e) => setLine(i, { qty: +e.target.value })} className="w-full px-1.5 py-1 text-xs border rounded text-right" style={{ borderColor: "#e5e0d8" }} /></td>
                    <td className="px-2 py-1 text-right text-xs font-medium" style={{ color: "#241f1b" }}>${(l.unitPrice * l.qty).toLocaleString()}</td>
                    <td className="px-1.5 py-1"><input value={l.note} onChange={(e) => setLine(i, { note: e.target.value })} className="w-full px-1.5 py-1 text-xs border rounded" style={{ borderColor: "#e5e0d8" }} /></td>
                    <td className="px-1 py-1 text-center"><button onClick={() => removeLine(i)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
                {q.items.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-xs" style={{ color: "#b3a99d" }}>尚無項目，點下方「從價目表加入」</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => setPick(true)} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded border" style={{ borderColor: "#d8cfc3", color: "#5c4638" }}><Plus className="w-3.5 h-3.5" />從價目表加入</button>
            <button onClick={addBlank} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded border" style={{ borderColor: "#d8cfc3", color: "#5c4638" }}><Plus className="w-3.5 h-3.5" />空白列</button>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-5">
            <div className="w-64 flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "#8b8076" }}>運費</span>
                <input type="number" value={q.shipping} onChange={(e) => setQ((s) => ({ ...s, shipping: +e.target.value }))} className="w-28 px-2 py-1 text-sm border rounded text-right" style={{ borderColor: "#e5e0d8" }} />
              </div>
              <div className="flex items-center justify-between text-sm px-1"><span style={{ color: "#8b8076" }}>合計</span><span>${subtotal.toLocaleString()}</span></div>
              <div className="flex items-center justify-between text-base font-bold px-2 py-1.5 rounded" style={{ background: "#f3ece0" }}><span>總金額</span><span>${total.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="mt-4">
            <L label="備註"><input value={q.notes} onChange={(e) => setQ((s) => ({ ...s, notes: e.target.value }))} className="inp" /></L>
          </div>
        </div>
      </main>

      {/* Product picker */}
      {pick && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setPick(false)}>
          <div className="bg-white rounded-lg w-[560px] max-h-[70vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: "#ece5da" }}>
              <Search className="w-4 h-4" style={{ color: "#b3a99d" }} />
              <input autoFocus value={pickSearch} onChange={(e) => setPickSearch(e.target.value)} placeholder="搜尋品名、代碼、廠商…" className="flex-1 text-sm outline-none" />
              <button onClick={() => setPick(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="overflow-y-auto">
              {pickFiltered.map((p) => {
                const per = perPillPrice(p.price, p.pillCount);
                return (
                  <button key={p.id} onClick={() => addProduct(p)} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b flex items-center justify-between" style={{ borderColor: "#f0ece5" }}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "#241f1b" }}>{p.code && <span className="font-mono text-xs mr-1.5" style={{ color: "#b3a99d" }}>{p.code}</span>}{p.name}</div>
                      <div className="text-xs" style={{ color: "#8b8076" }}>{p.vendor || ""}{p.pillCount ? ` · ${p.pillCount}顆` : ""}</div>
                    </div>
                    <div className="text-xs text-right shrink-0 ml-3" style={{ color: "#5c4638" }}>
                      {p.price ? `整罐 $${p.price.toLocaleString()}` : "無價"}{per != null ? ` · 單顆 $${per}` : ""}
                    </div>
                  </button>
                );
              })}
              {pickFiltered.length === 0 && <p className="px-4 py-6 text-center text-xs" style={{ color: "#b3a99d" }}>找不到符合的保健品</p>}
            </div>
          </div>
        </div>
      )}

      <style>{`.inp{width:100%;padding:6px 8px;font-size:13px;border:1px solid #d8cfc3;border-radius:4px;outline:none;background:#fff}`}</style>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1"><label className="text-xs font-medium" style={{ color: "#8b8076" }}>{label}</label>{children}</div>;
}
