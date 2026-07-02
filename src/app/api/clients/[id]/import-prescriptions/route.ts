import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import JSZip from "jszip";

type Params = { params: Promise<{ id: string }> };

// Parse table from docx XML
async function parseDocx(buffer: Buffer): Promise<{ date: string; items: string }[]> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("無法讀取 docx 內容");

  // Extract all <w:t> text nodes in order
  const textMatches = docXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
  const texts = textMatches.map((m) => m.replace(/<[^>]+>/g, "").trim()).filter(Boolean);

  // Find dates (pattern: month/day or month/day-month/day)
  const datePattern = /^\d{1,2}\/\d{1,2}/;
  const dateIndices: number[] = [];
  texts.forEach((t, i) => { if (datePattern.test(t)) dateIndices.push(i); });

  if (dateIndices.length === 0) throw new Error("找不到日期欄位（格式如 10/09）");

  // For each date column, collect prescription lines until next date or row-label keywords
  const stopKeywords = ["回診日期", "抽血日期", "保健品寄送", "備註", "處方內容"];
  const prescriptions: { date: string; items: string }[] = [];

  for (let d = 0; d < dateIndices.length; d++) {
    const dateIdx = dateIndices[d];
    const dateStr = texts[dateIdx];
    const nextDateIdx = dateIndices[d + 1] ?? texts.length;

    const lines: string[] = [];
    for (let i = dateIdx + 1; i < nextDateIdx; i++) {
      const t = texts[i];
      if (stopKeywords.some((k) => t.startsWith(k))) break;
      if (t && !datePattern.test(t)) lines.push(t);
    }
    if (lines.length > 0) {
      prescriptions.push({ date: dateStr, items: lines.join("\n") });
    }
  }

  return prescriptions;
}

// Parse table from xlsx
function parseXlsx(buffer: Buffer): { date: string; items: string }[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as string[][];

  if (rows.length < 2) throw new Error("表格內容不足");

  let dateRowIdx = 0;
  let prescRowStart = 1;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const cells = rows[i].slice(1).filter(Boolean);
    if (cells.length > 0) { dateRowIdx = i; prescRowStart = i + 1; break; }
  }

  const dateRow = rows[dateRowIdx];
  const colIndices: number[] = [];
  for (let c = 1; c < dateRow.length; c++) {
    if (String(dateRow[c]).trim()) colIndices.push(c);
  }
  if (colIndices.length === 0) throw new Error("找不到日期欄位");

  return colIndices.map((ci) => {
    const dateStr = String(dateRow[ci]).trim();
    const lines: string[] = [];
    for (let r = prescRowStart; r < rows.length; r++) {
      const cell = String(rows[r][ci] ?? "").trim();
      if (cell) lines.push(cell);
    }
    return { date: dateStr, items: lines.join("\n") };
  }).filter((p) => p.items);
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const mode = formData.get("mode") as string | null;

  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  let prescriptions: { date: string; items: string }[];
  try {
    if (name.endsWith(".docx")) {
      prescriptions = await parseDocx(buffer);
    } else {
      prescriptions = parseXlsx(buffer);
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 422 });
  }

  if (mode === "preview") {
    return NextResponse.json({ prescriptions });
  }

  const now = new Date().toISOString();
  const inserts = prescriptions.map((p) => ({
    id: crypto.randomUUID(),
    clientId: id,
    date: now,
    items: p.items,
    notes: `匯入日期：${p.date}`,
    status: "active",
    createdAt: now,
    updatedAt: now,
  }));

  const { error } = await supabase.from("Prescription").insert(inserts);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ imported: inserts.length });
}
