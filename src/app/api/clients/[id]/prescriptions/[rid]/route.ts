import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string; rid: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { rid } = await params;
  const data = await req.json();
  const { data: row, error } = await supabase
    .from("Prescription")
    .update({
      date: data.date ? new Date(data.date).toISOString() : undefined,
      items: JSON.stringify(data.items || []),
      totalDays: data.totalDays ? parseInt(data.totalDays) : null,
      runOutDate: data.runOutDate ? new Date(data.runOutDate).toISOString() : null,
      status: data.status,
      notes: data.notes || null,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", rid)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { rid } = await params;
  const { error } = await supabase.from("Prescription").delete().eq("id", rid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
