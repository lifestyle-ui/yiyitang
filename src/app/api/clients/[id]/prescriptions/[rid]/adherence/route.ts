import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string; rid: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { rid } = await params;
  const { data, error } = await supabase
    .from("AdherenceLog")
    .select("*")
    .eq("prescriptionId", rid)
    .order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: Params) {
  const { rid } = await params;
  const { date, status, note } = await req.json();
  const { data, error } = await supabase.from("AdherenceLog").insert({
    id: crypto.randomUUID(),
    prescriptionId: rid,
    date,
    status,
    note: note || null,
    createdAt: new Date().toISOString(),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: Request, { params }: Params) {
  const { searchParams } = new URL(req.url);
  const logId = searchParams.get("logId");
  if (!logId) return NextResponse.json({ error: "missing logId" }, { status: 400 });
  const { error } = await supabase.from("AdherenceLog").delete().eq("id", logId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
