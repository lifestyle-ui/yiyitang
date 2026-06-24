import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const { clientId } = await request.json();

  const [clientRes, trackingsRes, tasksRes] = await Promise.all([
    supabase.from("Client").select(`
      *,
      consultations:Consultation(*),
      doctorNotes:DoctorNote(*),
      prescriptions:Prescription(*),
      healthPlans:HealthPlan(*)
    `).eq("id", clientId).single(),
    supabase.from("LineTracking").select("*").eq("clientId", clientId)
      .order("date", { ascending: false }).limit(5),
    supabase.from("Task").select("*").eq("clientId", clientId)
      .neq("status", "done").order("dueDate", { ascending: true }).limit(10),
  ]);

  const clientData = clientRes.data;
  if (!clientData) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ summary: "AI 功能未設定，請聯繫管理員設定 ANTHROPIC_API_KEY。" });
  }

  const consultations = (clientData.consultations || []).slice(0, 5);
  const doctorNotes   = (clientData.doctorNotes || []).slice(0, 5);
  const prescriptions = (clientData.prescriptions || []).slice(0, 3);
  const healthPlans   = (clientData.healthPlans || []).filter((h: { status: string }) => h.status === "active").slice(0, 2);
  const trackings     = trackingsRes.data || [];
  const tasks         = tasksRes.data || [];

  const LINE_DIM_LABELS: Record<string, string> = {
    _eff: "有效性", _safe: "安全性", _reg: "規律性", _life: "生活方案", _urgent: "突發症狀",
  };

  const trackingText = trackings.map((t: { date: string; scores?: Record<string, string | number> | null; content?: string; followUpNeeded?: boolean }) => {
    const lines: string[] = [`${new Date(t.date).toLocaleDateString("zh-TW")}`];
    if (t.scores) {
      for (const [k, v] of Object.entries(t.scores)) {
        if (LINE_DIM_LABELS[k] && v) lines.push(`  ${LINE_DIM_LABELS[k]}：${v}`);
      }
    }
    if (t.content) lines.push(`  備注：${t.content}`);
    if (t.followUpNeeded) lines.push("  ⚠️ 需追蹤");
    return lines.join("\n");
  }).join("\n---\n") || "無";

  const taskText = tasks.map((t: { title: string; dueDate?: string; priority?: string }) =>
    `- ${t.title}${t.dueDate ? `（截止 ${new Date(t.dueDate).toLocaleDateString("zh-TW")}）` : ""}${t.priority === "high" ? " 🔴" : ""}`
  ).join("\n") || "無";

  const prompt = `你是意一堂的健管師助手，請根據以下客戶資料，用繁體中文撰寫一份「診前交班摘要」，目標是讓健管師在 3 分鐘內掌握全局，格式清晰、重點突出。

客戶：${clientData.name}（${clientData.gender || ""}）
電話：${clientData.phone || "未填"}

【最近諮詢記錄】
${consultations.map((c: { date: string; chiefComplaint?: string; content?: string }) => `${new Date(c.date).toLocaleDateString("zh-TW")}：${c.chiefComplaint || ""} ${c.content || ""}`).join("\n") || "無"}

【醫師處置】
${doctorNotes.map((d: { date: string; diagnosis?: string; treatment?: string }) => `${new Date(d.date).toLocaleDateString("zh-TW")}：${d.diagnosis || ""} ${d.treatment || ""}`).join("\n") || "無"}

【保健品處方】
${prescriptions.map((p: { date: string; items: unknown; adherenceStatus?: string }) => {
  let items: { name: string }[] = [];
  try { items = typeof p.items === "string" ? JSON.parse(p.items) : (p.items as { name: string }[]) || []; } catch { items = []; }
  const adh = p.adherenceStatus === "on_time" ? "按時服用" : p.adherenceStatus === "partial" ? "偶爾漏服" : p.adherenceStatus === "stopped" ? "已停用" : "未追蹤";
  return `${new Date(p.date).toLocaleDateString("zh-TW")}：${items.map(i => i.name).join("、")}（服藥：${adh}）`;
}).join("\n") || "無"}

【近期 LINE 追蹤（含五維度）】
${trackingText}

【待辦任務】
${taskText}

請提供以下格式的診前交班摘要：
1. **主訴與近期變化**（2-3 句，涵蓋最新 LINE 追蹤狀況）
2. **服藥規律性**（一句話說明是否按時服用）
3. **需特別注意事項**（突發症狀、安全性疑慮、緊急追蹤項目）
4. **客戶期待與今日目標**（根據歷史紀錄推估）
5. **下一步行動**（列出 3 點，優先從待辦任務中擷取）`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ summary });
}
