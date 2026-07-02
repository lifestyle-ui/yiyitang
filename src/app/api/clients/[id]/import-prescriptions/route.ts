import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const mode = formData.get("mode") as string | null; // "preview" | "import"

  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as string[][];

  if (rows.length < 2) return NextResponse.json({ error: "表格內容不足" }, { status: 422 });

  // Find date row (first row with content) and prescription rows
  // Expected format:
  //   Row 0: 初診(日期) | 日期 | 日期 | 複測(日期)  ← header labels (skip col 0)
  //   Row 1: 10/09 | 12/25-1/25 | 3/20-5/20 | ...  ← actual dates
  //   Row 2: 處方內容: ... | ...
  //   Row N: 回診日期: ... | ...

  // Detect date row: row where col>=1 cells contain date-like strings or are non-empty
  let dateRowIdx = 0;
  let prescRowStart = 1;

  // Try to find a row that has date-like content in col 1+
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const cells = rows[i].slice(1).filter(Boolean);
    if (cells.length > 0) {
      dateRowIdx = i;
      prescRowStart = i + 1;
      break;
    }
  }

  const dateRow = rows[dateRowIdx];
  // Columns that have a date (col index 1+)
  const colIndices: number[] = [];
  for (let c = 1; c < dateRow.length; c++) {
    if (String(dateRow[c]).trim()) colIndices.push(c);
  }

  if (colIndices.length === 0) return NextResponse.json({ error: "找不到日期欄位" }, { status: 422 });

  // Collect content per column
  const prescriptions = colIndices.map((ci) => {
    const dateStr = String(dateRow[ci]).trim();
    const lines: string[] = [];
    for (let r = prescRowStart; r < rows.length; r++) {
      const cell = String(rows[r][ci] ?? "").trim();
      if (cell) lines.push(cell);
    }
    return { date: dateStr, items: lines.join("\n") };
  }).filter((p) => p.items);

  if (mode === "preview") {
    return NextResponse.json({ prescriptions });
  }

  // Import mode
  const now = new Date().toISOString();
  const inserts = prescriptions.map((p) => ({
    id: crypto.randomUUID(),
    clientId: id,
    date: now, // will be overridden by notes
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
