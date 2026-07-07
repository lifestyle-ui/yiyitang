import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string; rid: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { rid } = await params;
  const data = await req.json();
  const { data: row, error } = await supabase
    .from("Prescription")
    .update({
      ...(data.date && { date: new Date(data.date).toISOString() }),
      ...(data.items !== undefined && { items: JSON.stringify(data.items || []) }),
      ...(data.totalDays !== undefined && { totalDays: data.totalDays ? parseInt(data.totalDays) : null }),
      ...(data.runOutDate !== undefined && { runOutDate: data.runOutDate ? new Date(data.runOutDate).toISOString() : null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.lifestyle !== undefined && { lifestyle: data.lifestyle || null }),
      ...(data.confirmedAt !== undefined && { confirmedAt: data.confirmedAt || null }),
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
