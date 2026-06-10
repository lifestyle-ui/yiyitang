import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string; rid: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { rid } = await params;
  const data = await req.json();
  const { data: row, error } = await supabase
    .from("DoctorNote")
    .update({
      date: data.date ? new Date(data.date).toISOString() : undefined,
      diagnosis: data.diagnosis || null,
      treatment: data.treatment || null,
      prescription: data.prescription || null,
      notes: data.notes || null,
      nextVisit: data.nextVisit ? new Date(data.nextVisit).toISOString() : null,
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
  const { error } = await supabase.from("DoctorNote").delete().eq("id", rid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
