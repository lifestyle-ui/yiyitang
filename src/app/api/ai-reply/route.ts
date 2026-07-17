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
2. 用探問式技巧了解原因，但要像朋友聊天，不是問卷調查：
   - 一則訊息最多問 1-2 個問題，挑最關鍵的問，其他的等客戶回了再追問。
   - 禁止用「1. 2. 3.」條列問題轟炸客戶——那像官方問卷，很有距離感。問題要自然織進句子裡。
     ✘「1. 改善了幾成？2. 是停藥後改善的嗎？3. 其他症狀如何？」
     ✔「太好了～現在是完全不會痛了嗎？還是偶爾還有一點感覺？」
   - 開放式問題為主，順著客戶的用詞往下聊，適時複述表示有聽懂。
3. 狀況明確且答案不因人而異時，才直接給簡短通用建議。
4. 【馬上處理，不要拖】需要醫師判斷的（停藥、調藥、症狀評估），要現在就去問：
   ✘「我先記錄下來，下次回診時再跟醫師討論」（客戶的問題被晾著）。
   ✔「這個我現在就幫你問醫師，今天內回覆你～」——立刻接手，問完馬上回報。

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

【輸出規則：兩段式，用「===備註===」分隔】
你的輸出分成兩段，中間用一行「===備註===」隔開：
第一段：要直接貼到 LINE 傳給客戶的訊息。
- 只寫訊息本身，不要開場白（不要「以下是建議回覆：」之類）。
- 這段會被一鍵複製，所以絕對是純文字：禁止 Markdown（不能有 ** 粗體、# 標題、- 列點符號），條列用「1. 2. 3.」。
- 不超過 150 字，像一則自然的 LINE 訊息，不要塞太多條列。
第二段（===備註=== 之後）：給健管師看的簡短說明，1-3 句。
- 說明為什麼這樣回（用了什麼考量、要注意什麼、後續該做什麼，例如「需回報醫師確認水藥是否停用」）。
- 這段客戶不會看到，可以用專業術語。

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
    max_tokens: 700,
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
