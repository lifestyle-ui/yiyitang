import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string; cid: string }> };

export async function POST(req: Request, { params }: Params) {
  const { cid } = await params;
  const { label, note, sortOrder } = await req.json();
  const now = new Date().toISOString();

  const { data, error } = await supabase.from("VisitCycleStep").insert({
    id: crypto.randomUUID(),
    cycleId: cid,
    label,
    note: note || null,
    sortOrder: sortOrder ?? 999,
    isCompleted: false,
    completedAt: null,
    createdAt: now,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
