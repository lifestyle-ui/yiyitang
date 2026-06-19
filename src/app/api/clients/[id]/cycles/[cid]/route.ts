import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string; cid: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { cid } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) {
    update.status = body.status;
    if (body.status === "completed") update.endDate = new Date().toISOString();
  }
  if (body.notes !== undefined) update.notes = body.notes || null;

  const { data, error } = await supabase
    .from("VisitCycle")
    .update(update)
    .eq("id", cid)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
