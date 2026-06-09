import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();

export async function POST(request: Request) {
  const { clientId } = await request.json();

  const clientData = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      consultations: { orderBy: { date: "desc" }, take: 5 },
      labTests: { orderBy: { createdAt: "desc" }, take: 3 },
      prescriptions: { orderBy: { date: "desc" }, take: 3 },
      doctorNotes: { orderBy: { date: "desc" }, take: 5 },
      healthPlans: { where: { status: "active" }, take: 2 },
    },
  });

  if (!clientData) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const prompt = `你是一位健康管理師助手，請根據以下客戶資料，用繁體中文撰寫一份簡潔的客戶健康摘要與建議。

客戶姓名：${clientData.name}
性別：${clientData.gender || "未填"}
電話：${clientData.phone || "未填"}

最近諮詢記錄（${clientData.consultations.length} 筆）：
${clientData.consultations.map((c) => `- ${new Date(c.date).toLocaleDateString("zh-TW")}：${c.chiefComplaint || ""} ${c.content || ""}`).join("\n") || "無"}

最近醫師處置（${clientData.doctorNotes.length} 筆）：
${clientData.doctorNotes.map((d) => `- ${new Date(d.date).toLocaleDateString("zh-TW")}：${d.diagnosis || ""} ${d.treatment || ""}`).join("\n") || "無"}

保健品處方：
${clientData.prescriptions.map((p) => `- ${new Date(p.date).toLocaleDateString("zh-TW")}：${JSON.stringify(p.items)}`).join("\n") || "無"}

健康計畫：
${clientData.healthPlans.map((h) => `- ${h.title}：${h.goals || ""}`).join("\n") || "無"}

請提供：
1. 客戶健康現況摘要（2-3 句）
2. 目前關注的主要健康問題
3. 給健管師的下一步行動建議（列出 3 點）`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const summary =
    message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ summary });
}
