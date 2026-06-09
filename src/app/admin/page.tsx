export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { Settings, Users, ClipboardList, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getStats() {
  const [totalClients, totalTasks, totalConsultations, totalPrescriptions] =
    await Promise.all([
      prisma.client.count({ where: { isActive: true } }),
      prisma.task.count(),
      prisma.consultation.count(),
      prisma.prescription.count(),
    ]);
  return { totalClients, totalTasks, totalConsultations, totalPrescriptions };
}

export default async function AdminPage() {
  const stats = await getStats();

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          管理設定
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">系統概覽與設定</p>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: "客戶總數", value: stats.totalClients, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: ClipboardList, label: "任務總數", value: stats.totalTasks, color: "text-amber-600", bg: "bg-amber-50" },
          { icon: MessageSquare, label: "諮詢記錄", value: stats.totalConsultations, color: "text-green-600", bg: "bg-green-50" },
          { icon: Settings, label: "保健品處方", value: stats.totalPrescriptions, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-xl p-4 ${stat.bg} border border-white`}>
              <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* 系統資訊 */}
      <Card>
        <CardHeader>
          <CardTitle>系統資訊</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600 space-y-2">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">系統名稱</span>
              <span className="font-medium">意一堂健康管理客戶系統</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">版本</span>
              <span className="font-medium">v1.0.0 MVP</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">主標題</span>
              <span className="font-medium">找回健康的根本力量</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">副標題</span>
              <span className="font-medium text-right max-w-xs">
                融合中醫與功能醫學，從根源改善健康問題，陪伴您打造長久健康人生。
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
