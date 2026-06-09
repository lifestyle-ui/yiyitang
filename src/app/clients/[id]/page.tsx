export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, formatDateTime, calculateAge } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClientTabs from "@/components/ClientTabs";
import AISummaryButton from "@/components/AISummaryButton";

type Params = { params: Promise<{ id: string }> };

async function getClient(id: string) {
  return prisma.client.findUnique({
    where: { id, isActive: true },
    include: {
      consultations: { orderBy: { date: "desc" } },
      labTests: { orderBy: { createdAt: "desc" } },
      prescriptions: { orderBy: { date: "desc" } },
      tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
      lineTrackings: { orderBy: { date: "desc" } },
      doctorNotes: { orderBy: { date: "desc" } },
      healthPlans: { orderBy: { createdAt: "desc" } },
    },
  });
}

export default async function ClientDetailPage({ params }: Params) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const age = calculateAge(client.birthDate);

  return (
    <div className="flex flex-col h-full">
      {/* 頂部導航 */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/clients"
              className="text-slate-400 hover:text-slate-600 mt-0.5"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">
                  {client.name}
                </h1>
                {client.gender && (
                  <Badge variant="outline">{client.gender}</Badge>
                )}
                {age && <Badge variant="outline">{age} 歲</Badge>}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                建立於 {formatDateTime(client.createdAt)}
              </p>
            </div>
          </div>
          <AISummaryButton clientId={client.id} />
        </div>

        {/* 聯絡資訊 */}
        <div className="flex flex-wrap gap-4 mt-3 ml-8">
          {client.phone && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {client.phone}
            </span>
          )}
          {client.email && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {client.email}
            </span>
          )}
          {client.lineId && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <span className="w-3.5 h-3.5 text-center leading-none font-bold text-xs">L</span>
              LINE: {client.lineId}
            </span>
          )}
          {client.address && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {client.address}
            </span>
          )}
          {client.occupation && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              {client.occupation}
            </span>
          )}
        </div>
      </div>

      {/* 統計數字 */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex gap-6">
        {[
          { label: "諮詢記錄", value: client.consultations.length },
          { label: "檢測", value: client.labTests.length },
          { label: "保健品處方", value: client.prescriptions.length },
          {
            label: "待辦任務",
            value: client.tasks.filter((t) => t.status !== "done").length,
          },
          { label: "LINE 追蹤", value: client.lineTrackings.length },
          { label: "醫師處置", value: client.doctorNotes.length },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-lg font-bold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 分頁內容 */}
      <div className="flex-1 overflow-auto">
        <ClientTabs client={JSON.parse(JSON.stringify(client))} />
      </div>
    </div>
  );
}
