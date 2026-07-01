import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ sid: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { sid } = await params;
  const body = await req.json();
  const now = new Date().toISOString();

  const wantsCompletion = body.status === "completed" || body.isCompleted === true;

  // Gating: isKeyOutput=true steps require deliverableDone before completion
  if (wantsCompletion) {
    const { data: current } = await supabase
      .from("VisitCycleStep")
      .select("isKeyOutput, deliverableDone")
      .eq("id", sid)
      .single();
    const alreadyDone = current?.deliverableDone as boolean | undefined;
    const willBeDone = body.deliverableDone === true;
    if (current?.isKeyOutput && !alreadyDone && !willBeDone) {
      return NextResponse.json(
        { error: "gating", message: "請先確認交付物完成（✓ 交付物）再標記此步驟完成" },
        { status: 422 }
      );
    }
  }

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
  if (body.sortOrder !== undefined) update.sortOrder = body.sortOrder;
  if (body.deliverableDone !== undefined) update.deliverableDone = body.deliverableDone;
  if (body.role !== undefined) update.role = body.role;
  if (body.deliverable !== undefined) update.deliverable = body.deliverable;
  if (body.isKeyOutput !== undefined) update.isKeyOutput = body.isKeyOutput;
  if (body.defaultOffset !== undefined) update.defaultOffset = body.defaultOffset;
  if (body.hasDueTracking !== undefined) update.hasDueTracking = body.hasDueTracking;
  if (body.metadata !== undefined) update.metadata = body.metadata;

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
