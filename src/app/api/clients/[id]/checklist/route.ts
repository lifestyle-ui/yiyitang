import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const { data: steps } = await supabase
    .from("OptionConfig")
    .select("label, sortOrder")
    .eq("category", "workflowStep")
    .order("sortOrder");

  const { data: completed } = await supabase
    .from("ClientChecklist")
    .select("label, isCompleted, completedAt")
    .eq("clientId", id);

  const completedMap = new Map((completed || []).map((c) => [c.label, c]));

  const result = (steps || []).map((step) => ({
    label: step.label,
    sortOrder: step.sortOrder,
    isCompleted: completedMap.get(step.label)?.isCompleted ?? false,
    completedAt: completedMap.get(step.label)?.completedAt ?? null,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const { label, isCompleted } = await req.json();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("ClientChecklist")
    .upsert(
      { id: crypto.randomUUID(), clientId: id, label, isCompleted, completedAt: isCompleted ? now : null },
      { onConflict: "clientId,label" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
