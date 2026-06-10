import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const { chiefComplaint, content, doctorAdvice, notes, clientName, date } = await request.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ tasks: [] });
  }

  const text = [
    chiefComplaint && `主訴：${chiefComplaint}`,
    content && `諮詢內容：${content}`,
    doctorAdvice && `醫師建議：${doctorAdvice}`,
    notes && `備註：${notes}`,
  ].filter(Boolean).join("\n");

  if (!text.trim()) return NextResponse.json({ tasks: [] });

  const today = date || new Date().toISOString().slice(0, 10);

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `你是健康管理系統助手。從以下諮詢記錄中，提取需要後續追蹤的具體行動任務。

客戶：${clientName}
諮詢日期：${today}

${text}

請以 JSON 陣列回傳任務，格式如下，只回傳 JSON，不要其他文字：
[
  {
    "title": "任務名稱（具體、可執行）",
    "dueDate": "YYYY-MM-DD（根據內容判斷合理截止日，若無法判斷則留空字串）",
    "priority": "high | medium | low"
  }
]

規則：
- 只提取明確的行動事項（如：安排檢查、回電追蹤、補充保健品等）
- 若無任何行動事項，回傳空陣列 []
- 最多 5 個任務
- dueDate 從今天 ${today} 起算`
    }],
  });

  try {
    const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const tasks = JSON.parse(cleaned);
    return NextResponse.json({ tasks: Array.isArray(tasks) ? tasks : [] });
  } catch {
    return NextResponse.json({ tasks: [] });
  }
}
