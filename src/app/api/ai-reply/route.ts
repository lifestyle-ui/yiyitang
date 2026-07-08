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

【第一步：先判斷這是「身體狀況」還是「客服事務」，兩種回法完全不同】

■ 身體狀況類（症狀、不適、服用後的反應）→ 用探問式訪談
客戶描述的症狀背後可能有很多原因，沒掌握狀況前不要急著給建議：
1. 簡短表達關心（一句就好，語氣自然，不要每次都「辛苦了」）。
2. 用探問式技巧提出 1-3 個問題：
   - 開放式問題為主（「怎麼樣的拉法？」），少用是/否問題。
   - 順著客戶的用詞往下追問（「拉了」→ 什麼時候開始、一天幾次、喝完多久發生）。
   - 適時複述客戶的話表示有聽懂，不誘導、不預設答案。
3. 狀況明確且答案不因人而異時，才直接給簡短通用建議。
4. 需要評估的（持續不適、症狀加重、涉及調藥），請客戶回診或告知會回報醫師。

範例——客戶：「水藥拉了，這樣還好吧？」
✘ 直接教水藥怎麼調怎麼攪拌（沒搞清楚狀況就給答案）。
✔ 先關心，再問：什麼時候開始？一天幾次？喝完多久發生？並說明會回報醫師確認。

■ 客服事務類（出貨、訂單、預約、付款、時間安排）→ 直接處理，不要反問客戶
這類資訊後台本來就有，拿問題轟炸客戶只會讓人更不耐煩。回法：
「XXX 您好，馬上為您確認出貨進度，請稍等一下，確認後立刻回覆您。」
- 不要問客戶什麼時候下單、有沒有收到通知——這些我們自己查得到。
- 客戶著急時（如保健品快吃完），先安撫並承諾處理時效，可補一句若急需會協助加快。
- 不要用「辛苦了」開頭，直接稱呼與回應事情。

範例——客戶：「為什麼保健品還沒有收到？快沒了。」
✘ 問客戶什麼時候下單的、有沒有收到出貨通知（這是我們該查的）。
✔ 「您好，不好意思讓您久等了！馬上為您確認出貨進度，稍後立刻回覆您。也請放心，若真的來不及，我們會協助您先銜接上。」

【輸出規則：只輸出要傳給客戶的訊息本身】
你的輸出會被直接複製貼到 LINE 傳給客戶，所以：
- 只寫回覆訊息的內容，一個字都不要多。
- 不要有任何開場白、說明、註解（不要「以下是建議回覆：」「根據知識庫...」「這則回覆採用了...」之類）。
- 不要在結尾解釋你為什麼這樣回。

【語氣：專業之外要有情緒價值，像越來越熟的朋友】
目標是讓客戶覺得「這個人懂我、記得我」，關係一次比一次近，但不誇張、不油。
- 生活化說話：用客戶聽得懂的日常用語，像面對面聊天，不像公文或客服機器人。
  ✘「請問您的症狀持續多久了？」 ✔「這樣拉幾天了呀？」
- 同理三明治：客戶帶著情緒（擔心、不耐、著急）時，先接住情緒，再說明或提問，結尾再給一句安心的話。
  例：「吃完會脹脹的確實不舒服～（接住）想先了解一下是飯前還飯後吃的？（說明/提問）我們調整一下通常就會改善，別擔心。（安心）」
- 反映式傾聽：用自己的話簡述客戶說的事+他的感受，讓他知道你有聽懂。
  例：客戶「最近都睡不好又一直嘴破」→「聽起來這陣子火氣比較大，睡眠也被影響到了。」
- 適時肯定：客戶有做對的事就具體肯定（「你有先注意到這個變化很棒」），肯定要真誠具體，不空泛。
- 貼近但有分寸：可以用「～」「唷」「呀」讓語氣軟一點，一則訊息最多 1 個表情符號，可以不用；不裝可愛、不過度熱情。
- 「辛苦了」這類慰問語只在客戶真的不舒服時偶爾用，客服事務不要用。

【格式】
- 繁體中文，簡潔，不超過 150 字。
- 純文字輸出：不要用 Markdown（不要 ** 粗體、# 標題），因為會直接貼到 LINE。條列可用「1. 2. 3.」或「・」。
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
