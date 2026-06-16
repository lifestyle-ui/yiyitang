"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { formatDate, calculateAge } from "@/lib/utils";
import Link from "next/link";
import { Plus, Search, Users, Upload, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Client = {
  id: string;
  name: string;
  medicalRecordNumber: string | null;
  gender: string | null;
  birthDate: string | null;
  phone: string | null;
  lineId: string | null;
  updatedAt: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchClients = async (q = "") => {
    setLoading(true);
    const res = await fetch(`/api/clients${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search) ||
    (c.lineId || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.medicalRecordNumber || "").toLowerCase().includes(search.toLowerCase())
  );

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
        await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />客戶管理
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {clients.length} 位客戶</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4" />下載範本
          </Button>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload className="w-4 h-4" />{importing ? "匯入中..." : "Excel 匯入"}
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
          <Link href="/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />新增客戶
          </Link>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋姓名、電話、LINE ID、病歷號碼..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <Card>
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">{search ? "找不到符合的客戶" : "尚無客戶資料，請新增或匯入"}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">病歷號碼</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">姓名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">性別 / 年齡</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">聯絡方式</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">最後更新</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-slate-500 text-xs font-mono">
                    {client.medicalRecordNumber || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="font-medium text-blue-700 hover:underline">{client.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {client.gender || "—"}{client.birthDate && ` / ${calculateAge(client.birthDate)} 歲`}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{client.phone || "—"}</div>
                    {client.lineId && <div className="text-xs text-green-600">LINE: {client.lineId}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(client.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
