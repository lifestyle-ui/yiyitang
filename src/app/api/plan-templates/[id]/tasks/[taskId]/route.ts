import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { taskId } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.phase !== undefined) update.phase = body.phase;
  if (body.durationHours !== undefined) update.durationHours = body.durationHours;
  if (body.orderIndex !== undefined) update.orderIndex = body.orderIndex;
  const { data, error } = await supabase
    .from("PlanTemplateTask")
    .update(update)
    .eq("id", taskId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { taskId } = await params;
  const { error } = await supabase.from("PlanTemplateTask").delete().eq("id", taskId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
