import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ sid: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { sid } = await params;
  const body = await req.json();
  const now = new Date().toISOString();

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) {
    update.status = body.status;
    update.isCompleted = body.status === "completed";
    update.completedAt = body.status === "completed" ? now : null;
  } else if (body.isCompleted !== undefined) {
    update.isCompleted = body.isCompleted;
    update.status = body.isCompleted ? "completed" : "pending";
    update.completedAt = body.isCompleted ? now : null;
  }
  if (body.note !== undefined) update.note = body.note;
  if (body.label !== undefined) update.label = body.label;

  const { data, error } = await supabase
    .from("VisitCycleStep")
    .update(update)
    .eq("id", sid)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { sid } = await params;
  const { error } = await supabase.from("VisitCycleStep").delete().eq("id", sid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
