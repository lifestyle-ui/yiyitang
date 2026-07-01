import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.label !== undefined) update.label = body.label;
  if (body.sortOrder !== undefined) update.sortOrder = body.sortOrder;
  if (body.role !== undefined) update.role = body.role;
  if (body.deliverable !== undefined) update.deliverable = body.deliverable;
  if (body.isKeyOutput !== undefined) update.isKeyOutput = body.isKeyOutput;
  if (body.defaultOffset !== undefined) update.defaultOffset = body.defaultOffset;
  if (body.hasDueTracking !== undefined) update.hasDueTracking = body.hasDueTracking;

  const { data, error } = await supabase
    .from("CycleTypeStep")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { error } = await supabase.from("CycleTypeStep").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
