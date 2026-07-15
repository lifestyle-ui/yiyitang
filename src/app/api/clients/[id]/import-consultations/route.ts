import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import JSZip from "jszip";

type Params = { params: Promise<{ id: string }> };

type ParsedConsultation = {
  date: string;
  visitType: string;
  chiefComplaint: string;
  content: string;
};

function cellText(cellXml: string): string {
  const matches = cellXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
  return matches.map((m) => m.replace(/<[^>]+>/g, "")).join("").trim();
}

// Parse consultation info from the 跟診 docx table:
// repeated blocks of 姓名/主述/診斷/備註 rows followed by a date-range row,
// a 處方內容 row, and a 回診日期/備註 row per date column.
async function parseDocx(buffer: Buffer): Promise<ParsedConsultation[]> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("無法讀取 docx 內容");

  const rowMatches = docXml.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || [];
  const table: string[][] = rowMatches.map((rowXml) => {
    const cellMatches = rowXml.match(/<w:tc[ >][\s\S]*?<\/w:tc>/g) || [];
    return cellMatches.map(cellText);
  });
  if (table.length === 0) throw new Error("找不到表格");

  const results: ParsedConsultation[] = [];
  const seen = new Set<string>();
  const datePattern = /\d{1,2}\/\d{1,2}/;

  // 初診 consultation from the first 主述/診斷 block
  let chief = "", diagnosis = "", firstVisitDate = "";
  for (const row of table) {
    if (row[0] === "主述" && !chief) chief = row[1] || "";
    if (row[0] === "診斷" && !diagnosis) diagnosis = row[1] || "";
    if (row[0] === "姓名" && !firstVisitDate) {
      const idx = row.findIndex((c) => c.includes("初診日期"));
      if (idx >= 0) firstVisitDate = row[idx + 1] || "";
    }
  }
  if (chief || diagnosis) {
    results.push({
      date: firstVisitDate || "初診",
      visitType: "initial",
      chiefComplaint: chief,
      content: diagnosis,
    });
  }

  // Per-date follow-up notes from the 回診日期/備註 rows
  for (let r = 0; r < table.length; r++) {
    const dateCells = table[r].filter((c) => datePattern.test(c));
    if (dateCells.length === 0 || table[r][0] === "主述" || table[r][0] === "診斷") continue;
    // This looks like a date-range row; the notes row is usually 2 rows below
    const dateRow = table[r];
    for (let c = 0; c < dateRow.length; c++) {
      if (!datePattern.test(dateRow[c])) continue;
      const noteCell = table[r + 2]?.[c] ?? "";
      // Strip label-only content (回診日期:抽血日期:保健品寄送:備註:)
      const note = noteCell
        .replace(/回診日期[:：]?/g, "\n回診日期:")
        .replace(/抽血日期[:：]?/g, "\n抽血日期:")
        .replace(/保健品寄送[:：]?/g, "\n保健品寄送:")
        .replace(/備註[:：]?/g, "\n備註:")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !/^(回診日期|抽血日期|保健品寄送|備註):?$/.test(l))
        .join("\n");
      if (!note) continue;
      const key = dateRow[c] + note;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ date: dateRow[c], visitType: "follow_up", chiefComplaint: "", content: note });
    }
  }

  if (results.length === 0) throw new Error("解析不到諮詢內容，請確認檔案格式");
  return results;
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const mode = formData.get("mode") as string | null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json({ error: "諮詢記錄匯入目前僅支援 .docx" }, { status: 422 });
  }

  let consultations: ParsedConsultation[];
  try {
    consultations = await parseDocx(buffer);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 422 });
  }

  if (mode === "preview") {
    return NextResponse.json({ consultations });
  }

  const now = new Date().toISOString();
  const inserts = consultations.map((c) => ({
    id: crypto.randomUUID(),
    clientId: id,
    date: now,
    visitType: c.visitType,
    chiefComplaint: c.chiefComplaint || null,
    content: [`原始日期：${c.date}`, c.content].filter(Boolean).join("\n"),
    createdAt: now,
    updatedAt: now,
  }));

  const { error } = await supabase.from("Consultation").insert(inserts);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ imported: inserts.length });
}
