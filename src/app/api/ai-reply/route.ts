import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-api-key") {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY 未設定" }, { status: 503 });
  }

  const { question, mode } = await req.json();
  // mode: "reply" | "faq"

  // Fetch knowledge base
  const { data: kb } = await supabase
    .from("KnowledgeBase")
    .select("title, content")
    .order("createdAt", { ascending: false })
    .limit(20);

  const kbContext = (kb || []).map((k) => `【${k.title}】\n${k.content}`).join("\n\n---\n\n");

  const client = new Anthropic({ apiKey });

  if (mode === "faq") {
    // Analyze LINE tracking conversations to extract FAQs
    const { data: lines } = await supabase
      .from("LineTracking")
      .select("content, response")
      .order("createdAt", { ascending: false })
      .limit(100);

    const conversations = (lines || [])
      .map((l) => `客戶：${l.content}${l.response ? `\n回覆：${l.response}` : ""}`)
      .join("\n\n");

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `以下是客戶的 LINE 對話紀錄，請從中提取最常見的 10 個問題，以 JSON 陣列格式回傳，每筆包含 question（問題）和 answer（建議回答）。只回傳 JSON，不要其他文字。\n\n${conversations}`,
      }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "[]";
    let faqs: { question: string; answer: string }[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      faqs = match ? JSON.parse(match[0]) : [];
    } catch { faqs = []; }

    // Save to FAQ table
    if (faqs.length > 0) {
      const now = new Date().toISOString();
      await supabase.from("FAQ").delete().neq("id", "placeholder"); // clear old
      await supabase.from("FAQ").insert(
        faqs.map((f, i) => ({
          id: crypto.randomUUID(),
          question: f.question,
          answer: f.answer,
          frequency: faqs.length - i,
          createdAt: now,
        }))
      );
    }
    return NextResponse.json({ faqs });
  }

  // mode === "reply"
  const systemPrompt = `你是意一堂健康管理診所的健管師助理，負責協助回覆客戶的 LINE 訊息。
請根據以下知識庫內容，用繁體中文、親切專業的語氣，針對客戶的問題提供建議回覆。
回覆要簡潔（不超過 150 字），實用，必要時可以請客戶預約諮詢。

${kbContext ? `=== 知識庫 ===\n${kbContext}` : "（目前知識庫無資料，請根據一般健康知識回答）"}`;

  const stream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: question }],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (e) {
        controller.enqueue(encoder.encode(`\n[錯誤] ${e instanceof Error ? e.message : "生成失敗"}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
