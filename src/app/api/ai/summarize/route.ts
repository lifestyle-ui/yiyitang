import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const { clientId } = await request.json();

  const { data: clientData } = await supabase
    .from("Client")
    .select(`
      *,
      consultations:Consultation(*),
      doctorNotes:DoctorNote(*),
      prescriptions:Prescription(*),
      healthPlans:HealthPlan(*)
    `)
    .eq("id", clientId)
    .single();

  if (!clientData) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ summary: "AI 功能未設定，請聯繫管理員設定 ANTHROPIC_API_KEY。" });
  }

  const consultations = (clientData.consultations || []).slice(0, 5);
  const doctorNotes = (clientData.doctorNotes || []).slice(0, 5);
  const prescriptions = (clientData.prescriptions || []).slice(0, 3);
  const healthPlans = (clientData.healthPlans || []).filter((h: { status: string }) => h.status === "active").slice(0, 2);

  const prompt = `你是一位健康管理師助手，請根據以下客戶資料，用繁體中文撰寫一份簡潔的客戶健康摘要與建議。

客戶姓名：${clientData.name}
性別：${clientData.gender || "未填"}
電話：${clientData.phone || "未填"}

最近諮詢記錄：
${consultations.map((c: { date: string; chiefComplaint?: string; content?: string }) => `- ${new Date(c.date).toLocaleDateString("zh-TW")}：${c.chiefComplaint || ""} ${c.content || ""}`).join("\n") || "無"}

最近醫師處置：
${doctorNotes.map((d: { date: string; diagnosis?: string; treatment?: string }) => `- ${new Date(d.date).toLocaleDateString("zh-TW")}：${d.diagnosis || ""} ${d.treatment || ""}`).join("\n") || "無"}

保健品處方：
${prescriptions.map((p: { date: string; items: string }) => `- ${new Date(p.date).toLocaleDateString("zh-TW")}：${p.items}`).join("\n") || "無"}

健康計畫：
${healthPlans.map((h: { title: string; goals?: string }) => `- ${h.title}：${h.goals || ""}`).join("\n") || "無"}

請提供：
1. 客戶健康現況摘要（2-3 句）
2. 目前關注的主要健康問題
3. 給健管師的下一步行動建議（列出 3 點）`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ summary });
}
