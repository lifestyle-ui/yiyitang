"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import QuoteEditor, { genOrderNo, todayISO, type QuoteData, type QuoteLine } from "@/components/QuoteEditor";

type QuoteRow = {
  id: string; orderNo: string | null; orderDate: string | null; orderType: string | null;
  clientName: string | null; items: string | null; shipping: number; notes: string | null; total: number; createdAt: string;
};

export default function QuotesPage() {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [editing, setEditing] = useState<QuoteData | null>(null);

  const load = async () => {
    const res = await fetch("/api/quotes");
    const data = await res.json();
    if (data.error) { setNeedsSetup(true); setRows([]); }
    else setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openRow = (r: QuoteRow) => {
    let items: QuoteLine[] = [];
    try { items = r.items ? JSON.parse(r.items) : []; } catch { items = []; }
    setEditing({
      id: r.id, orderNo: r.orderNo || "", orderDate: r.orderDate?.slice(0, 10) || todayISO(),
      orderType: r.orderType || "一般訂單", clientName: r.clientName || "",
      items, shipping: r.shipping || 0, notes: r.notes || "",
    });
  };
  const newQuote = () => setEditing({ orderNo: genOrderNo(), orderDate: todayISO(), orderType: "一般訂單", clientName: "", items: [], shipping: 0, notes: "" });

  const remove = async (id: string) => {
    if (!confirm("確定刪除這張報價單？")) return;
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      {editing && <QuoteEditor initial={editing} onClose={() => setEditing(null)} onSaved={load} />}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "#241f1b" }}>
            <FileText className="w-5 h-5" style={{ color: "#5c4638" }} />報價單
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#8b8076" }}>保健品報價單　·　也可從客戶處方直接產生</p>
        </div>
        {!needsSetup && <Button onClick={newQuote}><Plus className="w-4 h-4 mr-1" />新增報價單</Button>}
      </div>

      {loading ? (
        <p className="text-sm text-center py-16" style={{ color: "#b3a99d" }}>載入中...</p>
      ) : needsSetup ? (
        <Card><CardContent className="py-10 text-center text-sm" style={{ color: "#8b8076" }}>資料表尚未建立，請先在 Supabase 執行建表 SQL。</CardContent></Card>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm" style={{ color: "#8b8076" }}>尚無報價單。點「新增報價單」，或到客戶處方頁按「報價單」自動產生。</CardContent></Card>
      ) : (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#ece5da" }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: "#f3ece0", borderBottom: "1px solid #ece5da" }}>
              <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "#8b8076" }}>訂單編號</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "#8b8076" }}>日期</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "#8b8076" }}>客戶</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium" style={{ color: "#8b8076" }}>總金額</th>
              <th style={{ width: 40 }}></th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-[#f3ece0] cursor-pointer" style={{ borderBottom: "1px solid #ece5da" }} onClick={() => openRow(r)}>
                  <td className="px-4 py-3 font-medium" style={{ color: "#241f1b" }}>{r.orderNo || "—"}</td>
                  <td className="px-4 py-3" style={{ color: "#6b6056" }}>{r.orderDate ? formatDate(r.orderDate) : "—"}</td>
                  <td className="px-4 py-3" style={{ color: "#6b6056" }}>{r.clientName || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: "#241f1b" }}>${(r.total || 0).toLocaleString()}</td>
                  <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => remove(r.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
