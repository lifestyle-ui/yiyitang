"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Crown, ChevronDown, ChevronRight, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type DetItem = { code: string; name: string };
type Detection = {
  id: string;
  clientId: string | null;
  clientName: string;
  monthNum: number;
  month: string;
  packageType: string;
  items: string | null;
  scheduledDate: string | null;
  kitSentAt: string | null;
  sampleCollectedAt: string | null;
  sentToLabAt: string | null;
  completedAt: string | null;
  reportExplainedAt: string | null;
  notes: string | null;
};

const STAGES = [
  { key: "kitSentAt", label: "① 寄管具" },
  { key: "sampleCollectedAt", label: "② 檢體回收" },
  { key: "sentToLabAt", label: "③ 送檢" },
  { key: "completedAt", label: "④ 完成" },
] as const;

function statusOf(d: Detection): { label: string; color: string; bg: string } {
  if (d.completedAt) return { label: "已完成", color: "#15803D", bg: "#DCFCE7" };
  if (d.sentToLabAt) return { label: "送檢中", color: "#1D4ED8", bg: "#DBEAFE" };
  if (d.sampleCollectedAt) return { label: "檢體已回收", color: "#6D28D9", bg: "#EDE9FE" };
  if (d.kitSentAt) return { label: "已寄管具", color: "#B45309", bg: "#FEF3C7" };
  return { label: "尚未開始", color: "#6b6056", bg: "#f3ece0" };
}

function packageColor(pkg: string): string {
  if (pkg.includes("大")) return "#DC2626";
  if (pkg.includes("中")) return "#EA580C";
  if (pkg.includes("小")) return "#16A34A";
  return "#6b6056";
}

export default function VipDetectionPage() {
  const [rows, setRows] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    const res = await fetch("/api/vip-detection");
    const data = await res.json();
    if (data.error) { setNeedsSetup(true); setRows([]); }
    else setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStage = async (d: Detection, key: string, clear: boolean) => {
    const value = clear ? null : new Date().toISOString();
    setRows((prev) => prev.map((r) => r.id === d.id ? { ...r, [key]: value } : r));
    await fetch(`/api/vip-detection/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  };

  const setScheduled = async (d: Detection, value: string) => {
    setRows((prev) => prev.map((r) => r.id === d.id ? { ...r, scheduledDate: value } : r));
    await fetch(`/api/vip-detection/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledDate: value }),
    });
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Group by client, keep insertion order (already sorted by clientName, monthNum)
  const byClient: Record<string, Detection[]> = {};
  for (const r of rows) (byClient[r.clientName] ||= []).push(r);

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "#241f1b" }}>
          <Crown className="w-5 h-5" style={{ color: "#B45309" }} />VIP 檢測進度
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#8b8076" }}>年度瀚仕檢測計劃 — 追蹤每位 VIP 的檢測階段進度</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-5 text-xs" style={{ color: "#6b6056" }}>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#DC2626" }} />檢測 (大)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#EA580C" }} />檢測 (中)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#16A34A" }} />檢測 (小)</span>
        <span className="ml-2">階段：① 寄管具 → ② 檢體回收 → ③ 送檢 → ④ 完成（點一下標記今天，再點可清除）</span>
      </div>

      {loading ? (
        <p className="text-sm text-center py-16" style={{ color: "#b3a99d" }}>載入中...</p>
      ) : needsSetup ? (
        <Card><CardContent className="py-10 text-center text-sm" style={{ color: "#8b8076" }}>
          資料表尚未建立，請先在 Supabase 執行建表 SQL 並匯入資料。
        </CardContent></Card>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm" style={{ color: "#8b8076" }}>尚無 VIP 檢測資料</CardContent></Card>
      ) : (
        <div className="flex flex-col gap-5">
          {Object.entries(byClient).map(([name, dets]) => {
            const doneCount = dets.filter((d) => d.completedAt).length;
            return (
              <Card key={name}>
                <CardHeader style={{ background: "#FFFBF0", borderBottom: "1px solid #FEF3C7" }}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2" style={{ color: "#92400E" }}>
                      <Crown className="w-4 h-4" style={{ color: "#B45309" }} />
                      {dets[0].clientId
                        ? <Link href={`/clients/${dets[0].clientId}`} className="hover:underline">{name}</Link>
                        : name}
                    </CardTitle>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#B45309" }}>
                      今年完成 {doneCount} / {dets.length} 次
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {dets.map((d) => {
                    const st = statusOf(d);
                    const isOpen = expanded.has(d.id);
                    let items: DetItem[] = [];
                    try { items = d.items ? JSON.parse(d.items) : []; } catch { items = []; }
                    return (
                      <div key={d.id} className="border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-3 px-5 py-3 flex-wrap">
                          <span className="text-sm font-bold w-10 shrink-0" style={{ color: "#241f1b" }}>{d.month}</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: packageColor(d.packageType) + "18", color: packageColor(d.packageType) }}>
                            {d.packageType}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{ background: st.bg, color: st.color }}>
                            {st.label}
                          </span>

                          {/* Stage checkpoints */}
                          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                            {STAGES.map((s) => {
                              const val = d[s.key] as string | null;
                              return (
                                <button key={s.key}
                                  onClick={() => setStage(d, s.key, !!val)}
                                  title={val ? `${s.label}：${formatDate(val)}（點擊清除）` : `標記 ${s.label} 為今天`}
                                  className="text-[11px] px-2 py-1 rounded-md border transition-colors flex items-center gap-1"
                                  style={val
                                    ? { borderColor: "#86EFAC", background: "#F0FDF4", color: "#15803D" }
                                    : { borderColor: "#e5e0d8", background: "#fff", color: "#a89e91" }}>
                                  {val ? <Check className="w-3 h-3" /> : null}
                                  {s.label.replace(/^[①②③④]\s*/, "")}
                                  {val && <span className="opacity-70">{formatDate(val).slice(5)}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 px-5 pb-3 flex-wrap">
                          <label className="text-xs flex items-center gap-1.5" style={{ color: "#8b8076" }}>
                            預約日期
                            <input type="date" value={d.scheduledDate ? d.scheduledDate.slice(0, 10) : ""}
                              onChange={(e) => setScheduled(d, e.target.value)}
                              className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none" />
                          </label>
                          {items.length > 0 && (
                            <button onClick={() => toggleExpand(d.id)}
                              className="text-xs flex items-center gap-1 hover:underline" style={{ color: "#5c4638" }}>
                              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              檢測項目（{items.length} 項）
                            </button>
                          )}
                        </div>

                        {isOpen && items.length > 0 && (
                          <div className="px-5 pb-4">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 overflow-hidden">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                                {items.map((it, i) => (
                                  <div key={i} className="flex items-baseline gap-2 px-3 py-1.5 text-xs border-b border-slate-100"
                                    style={{ color: "#4b4239" }}>
                                    <span className="font-mono shrink-0" style={{ color: "#a89e91" }}>{it.code}</span>
                                    <span>{it.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
