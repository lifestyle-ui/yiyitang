import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ sid: string }> };

// 當這些步驟完成時，重新計算同週期內追蹤步驟的 dueDate
const RECEIPT_TRIGGERS = ["收到保健品", "服用起始日", "記錄服用"];

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

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
  if (body.dueDate !== undefined) update.dueDate = body.dueDate;
  if (body.metadata !== undefined) update.metadata = body.metadata;

  const { data, error } = await supabase
    .from("VisitCycleStep")
    .update(update)
    .eq("id", sid)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 當收到保健品/服用起始日步驟完成，重新從此時間點計算第1週、第3週 dueDate
  if (wantsCompletion && data) {
    const label: string = data.label ?? "";
    const isReceiptStep = RECEIPT_TRIGGERS.some((t) => label.includes(t));
    if (isReceiptStep) {
      const receiptDate = new Date(now);
      const cycleId: string = data.cycleId;

      const { data: siblings } = await supabase
        .from("VisitCycleStep")
        .select("id, label")
        .eq("cycleId", cycleId);

      if (siblings) {
        for (const s of siblings) {
          if (s.label.includes("第1週") || s.label.includes("第 1 週")) {
            await supabase.from("VisitCycleStep").update({
              dueDate: addDays(receiptDate, 7),
              hasDueTracking: true,
            }).eq("id", s.id);
          } else if (s.label.includes("第3週") || s.label.includes("第 3 週")) {
            await supabase.from("VisitCycleStep").update({
              dueDate: addDays(receiptDate, 21),
              hasDueTracking: true,
            }).eq("id", s.id);
          }
        }
      }
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { sid } = await params;
  const { error } = await supabase.from("VisitCycleStep").delete().eq("id", sid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
