import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// 根據類型定義要擷取的欄位
const FIELD_DEFINITIONS = {
  product: `
請從以下資料中擷取保健品資訊，回傳 JSON 陣列，每筆包含：
- name: 品名（必填）
- category: 類別（如：Omega 脂肪酸、維生素、礦物質、益生菌、草本植物、酵素、胺基酸、抗氧化、其他）
- brand: 品牌
- spec: 規格（如：1000mg、5000IU）
- dosage: 建議用法（如：每日2顆，飯後）
- unit: 單位（顆、粒、包、ml，預設「顆」）
- price: 售價（數字，元）
- notes: 備註或注意事項

只回傳 JSON 陣列，不要其他說明文字。若某欄位無資料，設為 null。`,

  testItem: `
請從以下資料中擷取檢測項目資訊，回傳 JSON 陣列，每筆包含：
- name: 項目名稱（必填）
- category: 類別（如：血液常規、生化代謝、荷爾蒙、免疫、過敏原、基因檢測、重金屬、腸道菌相、影像、其他）
- code: 項目代碼
- description: 說明
- price: 費用（數字，元）
- turnaround: 回報時間（如：3個工作天）
- notes: 注意事項（如：需空腹採血）

只回傳 JSON 陣列，不要其他說明文字。若某欄位無資料，設為 null。`,
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const type = formData.get("type") as "product" | "testItem";
  const text = formData.get("text") as string | null;
  const file = formData.get("file") as File | null;

  if (!type || !FIELD_DEFINITIONS[type]) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI 功能未設定，請聯繫管理員" }, { status: 500 });
  }

  try {
    let extractedData: unknown[] = [];

    if (file) {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".csv")) {
        // CSV 處理
        const csvText = await file.text();
        extractedData = await extractFromText(csvText, type);

      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        // Excel 處理
        const { read, utils } = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const csvText = utils.sheet_to_csv(sheet);
        extractedData = await extractFromText(csvText, type);

      } else if (file.type.startsWith("image/")) {
        // 圖片處理（Claude Vision）
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

        const message = await anthropic.messages.create({
          model: "claude-opus-4-5",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              {
                type: "text",
                text: FIELD_DEFINITIONS[type],
              },
            ],
          }],
        });

        const responseText = message.content[0].type === "text" ? message.content[0].text : "[]";
        extractedData = parseJSON(responseText);

      } else if (fileName.endsWith(".txt") || file.type === "text/plain") {
        const textContent = await file.text();
        extractedData = await extractFromText(textContent, type);
      } else {
        return NextResponse.json({ error: "不支援此檔案格式，請使用 CSV、Excel、圖片或文字檔" }, { status: 400 });
      }
    } else if (text) {
      extractedData = await extractFromText(text, type);
    } else {
      return NextResponse.json({ error: "請提供文字或檔案" }, { status: 400 });
    }

    return NextResponse.json({ data: extractedData });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "AI 擷取失敗，請重試" }, { status: 500 });
  }
}

async function extractFromText(text: string, type: "product" | "testItem") {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    messages: [{
      role: "user",
      content: `${FIELD_DEFINITIONS[type]}\n\n以下是要分析的資料：\n\n${text}`,
    }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "[]";
  return parseJSON(responseText);
}

function parseJSON(text: string): unknown[] {
  try {
    // 嘗試直接解析
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // 嘗試從文字中找到 JSON 陣列
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}
