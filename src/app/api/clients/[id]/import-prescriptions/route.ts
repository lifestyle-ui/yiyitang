import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import JSZip from "jszip";

type Params = { params: Promise<{ id: string }> };

// Extract text from a single cell XML string
function cellText(cellXml: string): string {
  const matches = cellXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
  return matches.map((m) => m.replace(/<[^>]+>/g, "")).join("").trim();
}

// Parse prescription table from docx XML
async function parseDocx(buffer: Buffer): Promise<{ date: string; items: string }[]> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("無法讀取 docx 內容");

  // Extract rows: split by <w:tr
  const rowMatches = docXml.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || [];

  // Parse each row into array of cell text strings
  const table: string[][] = rowMatches.map((rowXml) => {
    const cellMatches = rowXml.match(/<w:tc[ >][\s\S]*?<\/w:tc>/g) || [];
    return cellMatches.map(cellText);
  });

  if (table.length === 0) throw new Error("找不到表格");

  // Find the date row: contains cells matching date pattern like 10/09
  const datePattern = /^\d{1,2}\/\d{1,2}/;
  let dateRowIdx = -1;
  for (let r = 0; r < table.length; r++) {
    const dateCells = table[r].filter((c) => datePattern.test(c));
    if (dateCells.length >= 1) { dateRowIdx = r; break; }
  }
  if (dateRowIdx === -1) throw new Error("找不到日期欄位（格式如 10/09）");

  const dateRow = table[dateRowIdx];
  // Find columns that have dates (skip col 0 which is usually a label)
  const colIndices: number[] = [];
  for (let c = 0; c < dateRow.length; c++) {
    if (datePattern.test(dateRow[c])) colIndices.push(c);
  }

  // Stop collecting when hitting these row labels
  const stopKeywords = ["回診日期", "抽血日期", "保健品寄送", "備註"];

  // For each date column, collect text from rows below date row
  const prescriptions = colIndices.map((ci) => {
    const dateStr = dateRow[ci];
    const lines: string[] = [];
    for (let r = dateRowIdx + 1; r < table.length; r++) {
      const cell = table[r][ci] ?? "";
      if (!cell) continue;
      // Stop at row label keywords (usually in col 0)
      const rowLabel = table[r][0] ?? "";
      if (stopKeywords.some((k) => rowLabel.startsWith(k))) break;
      // Skip "處方內容:" label cells
      if (cell === "處方內容:" || cell === "處方內容") continue;
      lines.push(cell);
    }
    return { date: dateStr, items: lines.join("\n") };
  }).filter((p) => p.items);

  if (prescriptions.length === 0) throw new Error("解析不到處方內容，請確認表格格式");
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
