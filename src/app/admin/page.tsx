"use client";

import { useState, useEffect } from "react";
import { Settings, Users, ClipboardList, MessageSquare, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OptionManager from "@/components/OptionManager";

type Stats = { totalClients: number; totalTasks: number; totalConsultations: number; totalPrescriptions: number };

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({ totalClients: 0, totalTasks: 0, totalConsultations: 0, totalPrescriptions: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
    ]).then(([clients, tasks]) => {
      setStats({
        totalClients: Array.isArray(clients) ? clients.length : 0,
        totalTasks: Array.isArray(tasks) ? tasks.length : 0,
        totalConsultations: 0,
        totalPrescriptions: 0,
      });
    });
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />管理設定
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">系統概覽、選項管理</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-700">下拉選項管理</h2>
          <p className="text-xs text-slate-400">— 所有選單都在這裡新增、編輯、刪除</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OptionManager category="visitType" title="諮詢類型" />
          <OptionManager category="labTestType" title="檢測類型" />
          <OptionManager category="prescriptionStatus" title="處方狀態" />
          <OptionManager category="taskCategory" title="任務類別" />
          <OptionManager category="referralSource" title="轉介來源" />
          <OptionManager category="occupation" title="職業類別" />
          <OptionManager category="workflowStep" title="客戶流程步驟" />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>系統資訊</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600 space-y-2">
            {[
              { label: "系統名稱", value: "意一堂健康管理客戶系統" },
              { label: "版本", value: "v1.0.0 MVP" },
              { label: "主標題", value: "找回健康的根本力量" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
