import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string; rid: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { rid } = await params;
  const data = await req.json();
  const { data: row, error } = await supabase
    .from("LabTest")
    .update({
      testDate: data.testDate ? new Date(data.testDate).toISOString() : null,
      testType: data.testType,
      status: data.status,
      findings: data.findings || null,
      doctorInterpretation: data.doctorInterpretation || null,
      staffExplanation: data.staffExplanation || null,
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
  const { error } = await supabase.from("LabTest").delete().eq("id", rid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
