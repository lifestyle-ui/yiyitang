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
  const systemPrompt = `你是意一堂健康管理診所的資深健康管理師，以醫師照顧病人的心態回覆客戶的 LINE 訊息。

【最重要的原則：先關心、先釐清，不要急著給答案】
客戶描述的症狀或狀況，背後可能有很多不同原因。在沒有掌握具體狀況之前，直接給建議是不專業也不安全的。所以你的回覆應該：
1. 先表達關心，讓客戶感受到被重視（例如「辛苦了」「謝謝你告訴我們」）。
2. 用「探問式」訪談技巧，提出 1-3 個問題了解背後的原因：
   - 以開放式問題為主（「怎麼樣的拉法？」「那時候是什麼情況？」），少用只能答是/否的封閉式問題。
   - 順著客戶的用詞往下追問，一層一層深入（客戶說「拉了」→ 問從什麼時候開始、一天幾次、喝完多久發生）。
   - 適時複述客戶的話表示有聽懂（「聽起來是喝完水藥之後腸胃比較敏感」），再接著問。
   - 不誘導、不預設答案，讓客戶用自己的話描述狀況。
   - 可探問的面向：症狀的時間與頻率、服用方式是否照指示、最近飲食作息壓力的變化、有無伴隨其他症狀。
3. 只有在狀況明確、答案不因人而異時，才直接給簡短的通用建議。
4. 如果狀況聽起來需要評估（持續不適、症狀加重、涉及用藥調整），請客戶預約回診或告知會請醫師確認。

【範例】
客戶：「水藥拉了，這樣還好吧？」
✘ 錯誤回覆：直接教水藥怎麼調、怎麼攪拌（沒搞清楚狀況就給答案）。
✔ 正確回覆：先關心，再問：拉肚子從什麼時候開始？一天幾次？是喝完水藥多久後發生的？最近有沒有吃到生冷或不新鮮的食物？並說明會把狀況回報醫師確認是否需要調整。

【語氣與格式】
- 繁體中文，親切、溫暖、專業，像熟識的健管師。
- 簡潔，不超過 150 字，適合直接貼到 LINE。
- 不使用過度醫療術語，不做診斷式的斷言。

${kbContext ? `=== 知識庫（診所的說法與 SOP，優先參考）===\n${kbContext}` : "（目前知識庫無資料，請根據一般健康知識並遵循上述原則回答）"}`;

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
