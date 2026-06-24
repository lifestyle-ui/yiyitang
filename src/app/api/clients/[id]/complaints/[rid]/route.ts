import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; rid: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { rid } = await params;
  const body = await req.json();
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("Complaint").update({ ...body, updatedAt: now }).eq("id", rid).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { rid } = await params;
  const { error } = await supabase.from("Complaint").delete().eq("id", rid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
