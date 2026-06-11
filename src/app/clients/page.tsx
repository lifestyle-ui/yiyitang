export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { formatDate, calculateAge } from "@/lib/utils";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

async function getClients(search: string) {
  let query = supabase
    .from("Client")
    .select("*")
    .eq("isActive", true)
    .order("name", { ascending: true });

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,lineId.ilike.%${search}%`);
  }

  const { data } = await query;
  return data || [];
}

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search = "" } = await searchParams;
  const clients = await getClients(search);

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />客戶管理
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {clients.length} 位客戶</p>
        </div>
        <Link href="/clients/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />新增客戶
        </Link>
      </div>

      <form method="get" className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input name="search" defaultValue={search} placeholder="搜尋姓名、電話、LINE ID..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </form>

      <Card>
        {clients.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">{search ? "找不到符合的客戶" : "尚無客戶資料，請新增客戶"}</p>
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
              {clients.map((client) => (
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
