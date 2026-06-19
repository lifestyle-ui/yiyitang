import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

const DEFAULT_CYCLE_STEPS: Record<string, string[]> = {
  "初診": ["健康問卷收集", "初診諮詢", "功能醫學檢測", "等待報告", "報告解讀", "開立保健品處方", "安排回診"],
  "回診": ["回診諮詢", "狀況追蹤評估", "調整保健品處方", "安排下次回診"],
  "專項檢測": ["諮詢說明", "安排專項檢測", "等待報告", "報告解讀", "處置與建議"],
  "緊急評估": ["即時諮詢", "緊急檢測安排", "快速解讀", "處置方案"],
};

async function getStepsForType(type: string): Promise<string[]> {
  const { data } = await supabase
    .from("OptionConfig")
    .select("label, sortOrder")
    .eq("category", `cycleStep_${type}`)
    .order("sortOrder", { ascending: true });
  if (data && data.length > 0) return data.map((r) => r.label);
  return DEFAULT_CYCLE_STEPS[type] ?? DEFAULT_CYCLE_STEPS["回診"];
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const { data: cycles, error } = await supabase
    .from("VisitCycle")
    .select("*, steps:VisitCycleStep(*)")
    .eq("clientId", id)
    .order("startDate", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (cycles || []).map((c) => ({
    ...c,
    steps: (c.steps || []).sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder),
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const { type, notes } = await req.json();
  const steps = await getStepsForType(type);
  const now = new Date().toISOString();
  const cycleId = crypto.randomUUID();

  const { error: ce } = await supabase
    .from("VisitCycle")
    .insert({ id: cycleId, clientId: id, type, status: "active", startDate: now, createdAt: now, notes: notes ?? null });

  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 });

  const { error: se } = await supabase.from("VisitCycleStep").insert(
    steps.map((label, i) => ({
      id: crypto.randomUUID(), cycleId, label, sortOrder: i,
      isCompleted: false, completedAt: null, createdAt: now,
    }))
  );

  if (se) return NextResponse.json({ error: se.message }, { status: 500 });

  const { data } = await supabase
    .from("VisitCycle")
    .select("*, steps:VisitCycleStep(*)")
    .eq("id", cycleId)
    .single();

  return NextResponse.json(data, { status: 201 });
}
