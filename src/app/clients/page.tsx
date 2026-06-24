"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { formatDate, calculateAge } from "@/lib/utils";
import Link from "next/link";
import { Plus, Search, Users, Upload, Download, Bookmark, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Prescription = { status: string; runOutDate: string | null };

type Client = {
  id: string;
  name: string;
  medicalRecordNumber: string | null;
  gender: string | null;
  birthDate: string | null;
  phone: string | null;
  lineId: string | null;
  updatedAt: string;
  needsAttention: boolean;
  tags: string[] | null;
  prescriptions: Prescription[];
};

function getExpiringDays(prescriptions: Prescription[]): number | null {
  const active = (prescriptions || []).filter((p) => p.status === "active" && p.runOutDate);
  if (active.length === 0) return null;
  const days = active
    .map((p) => Math.ceil((new Date(p.runOutDate!).getTime() - Date.now()) / 86400000))
    .sort((a, b) => a - b)[0];
  return days <= 14 ? days : null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<"all" | "attention" | "expiring">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchClients = async () => {
    setLoading(true);
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const toggleAttention = async (client: Client) => {
    setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, needsAttention: !c.needsAttention } : c));
    await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needsAttention: !client.needsAttention }),
    });
  };

  const allTags = [...new Set(clients.flatMap((c) => c.tags || []))].sort();
  const attentionCount = clients.filter((c) => c.needsAttention).length;
  const expiringCount = clients.filter((c) => getExpiringDays(c.prescriptions) !== null).length;

  const filtered = clients
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.lineId || "").toLowerCase().includes(q) ||
        (c.medicalRecordNumber || "").toLowerCase().includes(q)
      );
    })
    .filter((c) => {
      if (quickFilter === "attention") return c.needsAttention;
      if (quickFilter === "expiring") return getExpiringDays(c.prescriptions) !== null;
      return true;
    })
    .filter((c) => !tagFilter || (c.tags || []).includes(tagFilter))
    .sort((a, b) => {
      if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
      return 0;
    });

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
      for (const row of rows) {
        await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) });
      }
      fetchClients();
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const csv = "name,medicalRecordNumber,gender,birthDate,phone,email,lineId,address,occupation,referralSource,notes\n許小明,MR-001,男,1990-05-20,0912345678,example@email.com,line_id,台北市,,朋友介紹,";
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "客戶資料範本.csv"; a.click();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "#1A1A1A" }}>
            <Users className="w-5 h-5" style={{ color: "#2C4A3E" }} />客戶管理
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#8A8580" }}>共 {clients.length} 位客戶</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={downloadTemplate}><Download className="w-4 h-4" />下載範本</Button>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload className="w-4 h-4" />{importing ? "匯入中..." : "Excel 匯入"}
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
          <Link href="/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-sm transition-colors"
            style={{ background: "#2C4A3E", color: "#F7F6F3" }}>
            <Plus className="w-4 h-4" />新增客戶
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A8A5A0" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋姓名、電話、LINE ID、病歷號碼..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-sm focus:outline-none"
          style={{ border: "1px solid #DDDAD4", background: "#FFFFFF" }}
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {([
          { key: "all", label: "全部", count: clients.length, style: "default" },
          { key: "attention", label: "⚑ 需關注", count: attentionCount, style: "amber" },
          { key: "expiring", label: "⏰ 處方快到期", count: expiringCount, style: "orange" },
        ] as const).map((f) => {
          const active = quickFilter === f.key;
          const bgMap = { default: "#2C4A3E", amber: "#FEF3C7", orange: "#FFF4E6" };
          const colorMap = { default: "#F7F6F3", amber: "#92400E", orange: "#C2600A" };
          const borderMap = { default: "#2C4A3E", amber: "#F6A330", orange: "#F4825A" };
          return (
            <button key={f.key}
              onClick={() => setQuickFilter(f.key)}
              className="px-3 py-1 text-xs rounded-full border transition-colors flex items-center gap-1"
              style={{
                background: active ? bgMap[f.style] : "#FFFFFF",
                color: active ? colorMap[f.style] : "#6A6560",
                borderColor: active ? borderMap[f.style] : "#DDDAD4",
                fontWeight: active ? 600 : 400,
              }}>
              {f.label}
              {f.count > 0 && <span className="opacity-70">({f.count})</span>}
            </button>
          );
        })}

        {allTags.length > 0 && <div className="h-4 w-px mx-1" style={{ background: "#DDDAD4" }} />}

        {allTags.map((tag) => (
          <button key={tag}
            onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
            className="px-3 py-1 text-xs rounded-full border transition-colors"
            style={{
              background: tagFilter === tag ? "#EFF4F1" : "#FFFFFF",
              color: tagFilter === tag ? "#2C4A3E" : "#6A6560",
              borderColor: tagFilter === tag ? "#2C4A3E" : "#DDDAD4",
              fontWeight: tagFilter === tag ? 600 : 400,
            }}>
            {tag}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="py-16 text-center text-sm" style={{ color: "#A8A5A0" }}>載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "#DDDAD4" }} />
            <p className="text-sm" style={{ color: "#8A8580" }}>
              {search || quickFilter !== "all" || tagFilter ? "找不到符合的客戶" : "尚無客戶資料，請新增或匯入"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #ECEAE6" }}>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#8A8580", width: "140px" }}>病歷號碼</th>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#8A8580" }}>姓名</th>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#8A8580" }}>性別 / 年齡</th>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#8A8580" }}>聯絡方式</th>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#8A8580" }}>處方狀態</th>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#8A8580" }}>最後更新</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const expiringDays = getExpiringDays(client.prescriptions);
                return (
                  <tr key={client.id}
                    style={{
                      borderBottom: "1px solid #F2F0EC",
                      background: client.needsAttention ? "#FFFBF0" : undefined,
                    }}
                    className={!client.needsAttention ? "hover:bg-slate-50" : undefined}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAttention(client)}
                          title={client.needsAttention ? "取消需關注" : "標記需關注"}
                          className="flex-shrink-0 transition-colors hover:scale-110"
                          style={{ color: client.needsAttention ? "#D97706" : "#D1CEC8" }}>
                          <Bookmark className="w-3.5 h-3.5" fill={client.needsAttention ? "#D97706" : "none"} />
                        </button>
                        <span className="font-mono text-xs" style={{ color: "#8A8580" }}>
                          {client.medicalRecordNumber || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <a href={`/clients/${client.id}`}
                            className="font-medium hover:underline"
                            style={{ color: "#2C4A3E" }}>
                            {client.name}
                          </a>
                          {client.needsAttention && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm" style={{ background: "#FEF3C7", color: "#92400E" }}>需關注</span>
                          )}
                        </div>
                        {(client.tags || []).length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {(client.tags || []).map((tag) => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-sm"
                                style={{ background: "#EFF4F1", color: "#2C4A3E", border: "1px solid #C4D4CC" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#6A6560" }}>
                      {client.gender || "—"}{client.birthDate && ` / ${calculateAge(client.birthDate)} 歲`}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#6A6560" }}>
                      <div>{client.phone || "—"}</div>
                      {client.lineId && (
                        <div className="text-xs" style={{ color: "#27AE60" }}>LINE: {client.lineId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {expiringDays !== null && (
                        <span className="text-xs flex items-center gap-1"
                          style={{ color: expiringDays <= 3 ? "#DC2626" : "#D97706" }}>
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          {expiringDays <= 0 ? "已用完" : `${expiringDays} 天後用完`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#A8A5A0" }}>
                      {formatDate(client.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
