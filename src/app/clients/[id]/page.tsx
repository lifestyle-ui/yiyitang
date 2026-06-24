export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { formatDateTime, calculateAge } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, MapPin, Briefcase, Pencil } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import ClientTabs from "@/components/ClientTabs";
import AISummaryButton from "@/components/AISummaryButton";

type Params = { params: Promise<{ id: string }> };

async function getClient(id: string) {
  const { data, error } = await supabase
    .from("Client")
    .select(`
      *,
      consultations:Consultation(*),
      labTests:LabTest(*),
      prescriptions:Prescription(*),
      tasks:Task(*),
      lineTrackings:LineTracking(*),
      doctorNotes:DoctorNote(*),
      healthPlans:HealthPlan(*),
      questionnaires:HealthQuestionnaire(*)
    `)
    .eq("id", id)
    .eq("isActive", true)
    .single();

  if (error) {
    console.error("getClient error:", JSON.stringify(error));
    // Fallback: try without HealthQuestionnaire in case table doesn't exist yet
    const { data: fallback, error: fallbackError } = await supabase
      .from("Client")
      .select(`
        *,
        consultations:Consultation(*),
        labTests:LabTest(*),
        prescriptions:Prescription(*),
        tasks:Task(*),
        lineTrackings:LineTracking(*),
        doctorNotes:DoctorNote(*),
        healthPlans:HealthPlan(*)
      `)
      .eq("id", id)
      .eq("isActive", true)
      .single();
    if (fallbackError) { console.error("fallback error:", JSON.stringify(fallbackError)); return null; }
    return { ...fallback, questionnaires: [] };
  }
  return data;
}

async function getExtra(id: string) {
  const [complaintsRes, timelineRes, matrixRes] = await Promise.all([
    supabase.from("Complaint").select("*").eq("clientId", id).order("date", { ascending: false }),
    supabase.from("HealthTimelineEvent").select("*").eq("clientId", id).order("date", { ascending: false }),
    supabase.from("FunctionalMatrix").select("*").eq("clientId", id).single(),
  ]);
  return {
    complaints: complaintsRes.data ?? [],
    timelineEvents: timelineRes.data ?? [],
    functionalMatrix: matrixRes.data ?? null,
  };
}

export default async function ClientDetailPage({ params }: Params) {
  const { id } = await params;
  const [client, extra] = await Promise.all([getClient(id), getExtra(id)]);
  if (!client) notFound();

  const age = calculateAge(client.birthDate);

  // Sort related data
  const sortedClient = {
    ...client,
    consultations: [...(client.consultations || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    labTests: [...(client.labTests || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    prescriptions: [...(client.prescriptions || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    tasks: [...(client.tasks || [])].sort((a, b) => new Date(a.dueDate || "9999").getTime() - new Date(b.dueDate || "9999").getTime()),
    lineTrackings: [...(client.lineTrackings || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    doctorNotes: [...(client.doctorNotes || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    healthPlans: [...(client.healthPlans || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    questionnaires: [...(client.questionnaires || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    complaints: extra.complaints,
    timelineEvents: extra.timelineEvents,
    functionalMatrix: extra.functionalMatrix,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href="/clients" className="text-slate-400 hover:text-slate-600 mt-0.5">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">{client.name}</h1>
                {client.gender && <Badge variant="outline">{client.gender}</Badge>}
                {age && <Badge variant="outline">{age} 歲</Badge>}
                {client.medicalRecordNumber && <Badge variant="outline" className="font-mono text-xs">#{client.medicalRecordNumber}</Badge>}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">建立於 {formatDateTime(client.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/clients/${client.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Pencil className="w-3.5 h-3.5" />編輯資料
            </Link>
            <AISummaryButton clientId={client.id} />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-3 ml-8">
          {client.phone && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400" />{client.phone}
            </span>
          )}
          {client.email && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400" />{client.email}
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
              <MapPin className="w-3.5 h-3.5 text-slate-400" />{client.address}
            </span>
          )}
          {client.occupation && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />{client.occupation}
            </span>
          )}
        </div>
      </div>

      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex gap-6">
        {[
          { label: "諮詢記錄", value: sortedClient.consultations.length },
          { label: "醫師處置", value: sortedClient.doctorNotes.length },
          { label: "檢測", value: sortedClient.labTests.length },
          { label: "保健品處方", value: sortedClient.prescriptions.length },
          { label: "待辦任務", value: sortedClient.tasks.filter((t: { status: string }) => t.status !== "done").length },
          { label: "LINE 追蹤", value: sortedClient.lineTrackings.length },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-lg font-bold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        <ClientTabs client={JSON.parse(JSON.stringify(sortedClient))} />
      </div>
    </div>
  );
}
